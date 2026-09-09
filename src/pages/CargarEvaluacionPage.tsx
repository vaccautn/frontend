import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Dialog, Input, Portal, Table } from "@chakra-ui/react";
import { toast } from "react-toastify";
import { IconTrash } from "@tabler/icons-react";
import { getSesion } from "@/features/sesiones/services/sesionesService";
import {
  getAnimalesAgrupadosPorLote,
  getEvaluacionesCc,
  registrarEvaluacionCCCompleta,
  updateEvaluacionCcEnSesion,
} from "@/features/animales/services/animalesService";
import { getLotes } from "@/features/lotes/services/lotesService";
import { actualizarSesion, eliminarSesion } from "@/features/sesiones/services/sesionesService";
import { AnimalesFiltros } from "@/features/animales/components/AnimalesFiltros";
import { useAnimalesFiltros } from "@/features/animales/hooks/useAnimalesFiltros";
import {
  RegistrarEvaluacionCCDialog,
  type EvaluacionCCPendiente,
} from "@/features/animales/components/RegistrarEvaluacionCCDialog"; // ajustar ruta real
import type { SesionCapturaRead } from "@/features/sesiones/types";
import type { Animal, AnimalLoteGroup, EvaluacionCC } from "@/features/animales/types";
import type { LoteOption } from "@/features/lotes/types";
import { formatEventDate, localNaiveNow } from "@/utils/localDateTime";
import { normalizeBackendDetail } from "@/features/auth";
import { ApiError } from "@/services/httpClient";
import { CATEGORIA_ANIMAL_LABELS } from "@/features/animales/constants";
import "@/features/animales/components/animales.css";
import "@/features/sesiones/components/sesiones.css";

export function CargarEvaluacionesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sesionId = Number(id);

  const [sesion, setSesion] = useState<SesionCapturaRead | null>(null);
  const [grupos, setGrupos] = useState<AnimalLoteGroup[]>([]);
  const [lotes, setLotes] = useState<LoteOption[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(true);
  const [animalSeleccionado, setAnimalSeleccionado] = useState<Animal | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refetchingGrupos, setRefetchingGrupos] = useState(false);
  const [isFinalizando, setIsFinalizando] = useState(false);
  const [confirmDeleteSesion, setConfirmDeleteSesion] = useState(false);
  const [isDeletingSesion, setIsDeletingSesion] = useState(false);
  const [fechaSesionInput, setFechaSesionInput] = useState("");
  const [isActualizandoFecha, setIsActualizandoFecha] = useState(false);

  const [evaluacionesPersistidas, setEvaluacionesPersistidas] = useState<Map<number, EvaluacionCC>>(new Map());

  const {
    caravanaInput,
    sexo,
    raza,
    estado,
    loteId,
    categoriaLote,
    setCaravanaInput,
    setSexo,
    setRaza,
    setEstado,
    setLoteId,
    setCategoriaLote,
    params: filtrosParams,
  } = useAnimalesFiltros();

  useEffect(() => {
    getLotes()
      .then(setLotes)
      .finally(() => setLoadingLotes(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([getSesion(sesionId), getEvaluacionesCc({ sesionId })])
      .then(([sesionData, evaluacionesData]) => {
        setSesion(sesionData);
        setFechaSesionInput(sesionData.fecha_inicio.slice(0, 10));
        setEvaluacionesPersistidas(new Map(evaluacionesData.map((item) => [item.animal_id, item])));
      })
      .catch(() => toast.error("No se pudo cargar la sesión."))
      .finally(() => setLoading(false));
  }, [sesionId]);

  // Los mismos filtros que la página de animales (caravana, sexo, raza,
  // estado, lote), para encontrar rápido a quién falta evaluar en la sesión.
  useEffect(() => {
    setRefetchingGrupos(true);
    getAnimalesAgrupadosPorLote(filtrosParams)
      .then(setGrupos)
      .catch(() => toast.error("No se pudieron cargar los animales."))
      .finally(() => setRefetchingGrupos(false));
  }, [filtrosParams]);

  // El backend no filtra por categoría de lote, así que se aplica acá sobre
  // los grupos ya cargados (cada grupo trae su lote completo, con categoría).
  const gruposFiltrados = useMemo(() => {
    if (!categoriaLote) return grupos;
    return grupos.filter((grupo) => grupo.lote?.categoria === categoriaLote);
  }, [grupos, categoriaLote]);

  const hoyStr = useMemo(() => localNaiveNow().slice(0, 10), []);

  // Fecha con la que se registra cada evaluación nueva: el día elegido para
  // la sesión (para simular carga histórica), con la hora actual.
  const fechaEvaluacionBase = useMemo(() => {
    if (!sesion) return localNaiveNow();
    return `${sesion.fecha_inicio.slice(0, 10)}${localNaiveNow().slice(10)}`;
  }, [sesion]);

  const handleConfirmarFechaSesion = async () => {
    if (!sesion || !fechaSesionInput) return;
    if (fechaSesionInput === sesion.fecha_inicio.slice(0, 10)) return;
    if (fechaSesionInput > hoyStr) {
      toast.error("La fecha de la sesión no puede ser posterior a hoy.");
      return;
    }

    setIsActualizandoFecha(true);
    try {
      const actualizada = await actualizarSesion(sesionId, {
        fecha_inicio: `${fechaSesionInput}${sesion.fecha_inicio.slice(10)}`,
      });
      setSesion(actualizada);
      setFechaSesionInput(actualizada.fecha_inicio.slice(0, 10));
      toast.success("Fecha de la sesión actualizada.");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? normalizeBackendDetail(error.detail)
          : "No se pudo actualizar la fecha de la sesión.",
      );
    } finally {
      setIsActualizandoFecha(false);
    }
  };

  // Cada evaluación (y sus imágenes) se crea y valida contra el modelo de IA
  // apenas se guarda el diálogo, no al finalizar la carga — así el usuario se
  // entera al toque si una foto fue rechazada por no contener un bovino.
  const handleGuardarEvaluacion = useCallback(
    async (data: EvaluacionCCPendiente): Promise<boolean> => {
      if (!animalSeleccionado) return false;
      const animalId = animalSeleccionado.id;
      const existente = evaluacionesPersistidas.get(animalId);

      if (existente) {
        try {
          const actualizada = await updateEvaluacionCcEnSesion(existente.id, sesionId, {
            valor_cc: data.valorCc,
            observaciones: data.observaciones,
          });
          setEvaluacionesPersistidas((prev) => new Map(prev).set(animalId, actualizada));
          toast.success("Evaluación actualizada.");
          return true;
        } catch (error) {
          toast.error(
            error instanceof ApiError
              ? normalizeBackendDetail(error.detail)
              : "No se pudo actualizar la evaluación. Probá nuevamente.",
          );
          return false;
        }
      }

      try {
        const { evaluacion, imagenesError } = await registrarEvaluacionCCCompleta({
          sesionId,
          animalId,
          valorCc: data.valorCc,
          escalaMin: data.escalaMin,
          escalaMax: data.escalaMax,
          observaciones: data.observaciones,
          fecha: data.fecha,
          files: data.files,
        });
        setEvaluacionesPersistidas((prev) => new Map(prev).set(animalId, evaluacion));

        if (imagenesError) {
          toast.error(imagenesError);
        } else {
          toast.success(
            data.files.length > 0
              ? "Evaluación registrada e imágenes subidas correctamente."
              : "Evaluación registrada.",
          );
        }
        return true;
      } catch (error) {
        toast.error(
          error instanceof ApiError
            ? normalizeBackendDetail(error.detail)
            : "No se pudo registrar la evaluación. Probá nuevamente.",
        );
        return false;
      }
    },
    [animalSeleccionado, evaluacionesPersistidas, sesionId],
  );

  const handleFinalizarCarga = useCallback(async () => {
    setIsFinalizando(true);

    try {
      await actualizarSesion(sesionId, {
        estado: "CERRADA",
        fecha_fin: localNaiveNow(),
      });
    } catch (error) {
      setIsFinalizando(false);
      if (error instanceof ApiError && error.status === 409) {
        toast.error(
          "La sesión no se pudo cerrar porque no tiene evaluaciones vigentes. Volvé a cargar la sesión y verificá las evaluaciones guardadas.",
        );
      } else if (error instanceof ApiError && error.status === 404) {
        toast.error("La sesión ya no está disponible. Volviendo al listado.");
        navigate("/sesiones");
      } else {
        toast.error(
          "Ocurrió un error al cerrar la sesión. Revisá tu conexión e intentá finalizar de nuevo.",
        );
      }
      return;
    }

    setIsFinalizando(false);
    toast.success("Sesión finalizada correctamente.");
    navigate("/sesiones");
  }, [sesionId, navigate]);

  const handleDeleteSesion = async () => {
    setIsDeletingSesion(true);
    try {
      await eliminarSesion(sesionId);
      toast.success("Sesión eliminada correctamente.");
      navigate("/sesiones");
    } catch {
      toast.error("No se pudo eliminar la sesión.");
      setIsDeletingSesion(false);
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (!sesion) return <p>Sesión no encontrada.</p>;

  return (
    <section>
      <div className="section-header">
        <div className="title-and-description">
          <h1>Cargando evaluación del {formatEventDate(sesion.fecha_inicio)}</h1>
          <p>{evaluacionesPersistidas.size} evaluación(es) cargadas en esta sesión.</p>
        </div>
        <div className="sesion-detail__hero-actions">
          <button
            type="button"
            className="animal-detail__action animal-detail__action--danger"
            onClick={() => setConfirmDeleteSesion(true)}>
            <IconTrash size={16} stroke={1.5} />
            Eliminar sesión
          </button>
          <Button
            colorPalette="brand"
            onClick={handleFinalizarCarga}
            loading={isFinalizando}
            loadingText="Guardando...">
            Finalizar carga
          </Button>
        </div>
      </div>

      <div className="cargar-evaluacion__fecha-sesion">
        <div className="sesiones-filtros__campo">
          <label htmlFor="fecha-sesion" className="cargar-evaluacion__fecha-label">
            Fecha de la evaluación:
          </label>
          <Input
            id="fecha-sesion"
            type="date"
            max={hoyStr}
            value={fechaSesionInput}
            onChange={(event) => setFechaSesionInput(event.target.value)}
            aria-label="Fecha a la que pertenece la sesión"
            className="animales-filtros__input"
          />
        </div>
        <Button
          colorPalette="brand"
          onClick={handleConfirmarFechaSesion}
          loading={isActualizandoFecha}
          disabled={
            !fechaSesionInput ||
            fechaSesionInput === sesion.fecha_inicio.slice(0, 10)
          }>
          Confirmar fecha
        </Button>
      </div>

      <AnimalesFiltros
        caravanaInput={caravanaInput}
        sexo={sexo}
        raza={raza}
        estado={estado}
        loteId={loteId}
        categoriaLote={categoriaLote}
        lotes={lotes}
        loadingLotes={loadingLotes}
        onCaravanaChange={setCaravanaInput}
        onSexoChange={setSexo}
        onRazaChange={setRaza}
        onEstadoChange={setEstado}
        onLoteChange={setLoteId}
        onCategoriaLoteChange={setCategoriaLote}
      />

      <Table.Root
        className="animales-table"
        interactive
        style={{
          opacity: refetchingGrupos ? 0.6 : 1,
          transition: "opacity 0.15s",
        }}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Caravana</Table.ColumnHeader>
            <Table.ColumnHeader>Raza</Table.ColumnHeader>
            <Table.ColumnHeader>Lote</Table.ColumnHeader>
            <Table.ColumnHeader>Categoría del lote</Table.ColumnHeader>
            <Table.ColumnHeader>Valor CC</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {gruposFiltrados.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={5}>
                No se encontraron animales con los filtros aplicados.
              </Table.Cell>
            </Table.Row>
          ) : (
            gruposFiltrados.flatMap((grupo) =>
              grupo.animales.map((animal) => (
                <Table.Row
                  key={animal.id}
                  className="animales-table__row"
                  onClick={() => setAnimalSeleccionado(animal)}>
                  <Table.Cell>{animal.caravana ?? "—"}</Table.Cell>
                  <Table.Cell>{animal.raza}</Table.Cell>
                  <Table.Cell>{grupo.lote?.nombre ?? "Sin lote"}</Table.Cell>
                  <Table.Cell>
                    {grupo.lote
                      ? (CATEGORIA_ANIMAL_LABELS[grupo.lote.categoria] ?? "—")
                      : "—"}
                  </Table.Cell>
                  <Table.Cell>
                    {evaluacionesPersistidas.get(animal.id)?.valor_cc ?? "—"}
                  </Table.Cell>
                </Table.Row>
              )),
            )
          )}
        </Table.Body>
      </Table.Root>

      <RegistrarEvaluacionCCDialog
        animal={animalSeleccionado}
        open={!!animalSeleccionado}
        evaluacionExistente={
          animalSeleccionado
            ? (evaluacionesPersistidas.get(animalSeleccionado.id) ?? null)
            : null
        }
        fechaBase={fechaEvaluacionBase}
        onClose={() => setAnimalSeleccionado(null)}
        onGuardar={handleGuardarEvaluacion}
      />

      <Dialog.Root
        open={confirmDeleteSesion}
        onOpenChange={(details) => !details.open && setConfirmDeleteSesion(false)}>
        <Portal>
          <Dialog.Backdrop className="animal-evaluacion__backdrop" />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Eliminar sesión</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                Se eliminará la sesión #{sesionId} y todas las evaluaciones cargadas hasta
                ahora. Esta acción no se puede deshacer.
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="ghost"
                  onClick={() => setConfirmDeleteSesion(false)}
                  disabled={isDeletingSesion}>
                  Cancelar
                </Button>
                <Button
                  colorPalette="red"
                  onClick={handleDeleteSesion}
                  loading={isDeletingSesion}>
                  Eliminar
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </section>
  );
}
