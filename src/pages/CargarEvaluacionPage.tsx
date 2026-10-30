import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Dialog, Portal, Table } from "@chakra-ui/react";
import { toast } from "react-toastify";
import { IconCheck, IconChevronRight, IconTrash } from "@tabler/icons-react";
import { getSesion } from "@/features/sesiones/services/sesionesService";
import {
  getAnimalesAgrupadosPorLote,
  getEntradasSesion,
  registrarEvaluacionCCCompleta,
  updateEvaluacionCcEnSesion,
} from "@/features/animales/services/animalesService";
import { getLotes } from "@/features/lotes/services/lotesService";
import {
  actualizarSesion,
  eliminarSesion,
} from "@/features/sesiones/services/sesionesService";
import { AnimalesFiltros } from "@/features/animales/components/AnimalesFiltros";
import { useAnimalesFiltros } from "@/features/animales/hooks/useAnimalesFiltros";
import {
  RegistrarEvaluacionCCDialog,
  type EvaluacionCCPendiente,
} from "@/features/animales/components/RegistrarEvaluacionCCDialog"; // ajustar ruta real
import type { SesionCapturaRead } from "@/features/sesiones/types";
import type {
  Animal,
  AnimalLoteGroup,
  EvaluacionCC,
} from "@/features/animales/types";
import type { EntradasSesionRead } from "@/features/animales/types";
import type { LoteOption } from "@/features/lotes/types";
import { localNaiveNow } from "@/utils/localDateTime";
import { getStoredUser, normalizeBackendDetail } from "@/features/auth";
import { ApiError } from "@/services/httpClient";
import { CATEGORIA_ANIMAL_LABELS } from "@/features/animales/constants";
import { nivelCC } from "@/features/animales/utils/ccColor";
import { AnalisisVideoSesion } from "@/features/sesiones/components/AnalisisVideoSesion";
import { aplicarEntradasVideoRefrescadas } from "@/features/sesiones/services/analisisVideoRecovery";
import { FechaInput } from "@/components/FechaInput";
import "@/features/animales/components/animales.css";
import "@/features/sesiones/components/sesiones.css";

type Vista = "todos" | "pendientes" | "evaluados";

const VISTAS: { value: Vista; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pendientes", label: "Pendientes" },
  { value: "evaluados", label: "Registrados" },
];

/** "27 de octubre de 2026" a partir de un "YYYY-MM-DD..." (sin zona horaria:
 * se arma la fecha al mediodía para que no cambie de día). */
function fechaLarga(fecha: string): string {
  const [anio, mes, dia] = fecha.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(anio, mes - 1, dia, 12));
}

export function CargarEvaluacionesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sesionId = Number(id);
  const usuarioId = getStoredUser()?.id ?? 0;

  const [sesion, setSesion] = useState<SesionCapturaRead | null>(null);
  const [grupos, setGrupos] = useState<AnimalLoteGroup[]>([]);
  const [lotes, setLotes] = useState<LoteOption[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(true);
  const [animalSeleccionado, setAnimalSeleccionado] = useState<Animal | null>(
    null,
  );
  const animalSeleccionadoRef = useRef<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [refetchingGrupos, setRefetchingGrupos] = useState(false);
  const [isFinalizando, setIsFinalizando] = useState(false);
  const [confirmDeleteSesion, setConfirmDeleteSesion] = useState(false);
  const [isDeletingSesion, setIsDeletingSesion] = useState(false);
  const [fechaSesionInput, setFechaSesionInput] = useState("");
  const [isActualizandoFecha, setIsActualizandoFecha] = useState(false);
  const [vista, setVista] = useState<Vista>("todos");

  const [evaluacionesPersistidas, setEvaluacionesPersistidas] = useState<
    Map<number, EvaluacionCC>
  >(new Map());
  const [entradasSesion, setEntradasSesion] = useState<EntradasSesionRead>({
    orden_disponible: false,
    items: [],
  });
  const requestVideoEntriesRefreshRef = useRef<(() => Promise<void>) | null>(null);
  const sesionActualRef = useRef(sesionId);

  useEffect(() => {
    sesionActualRef.current = sesionId;
  }, [sesionId]);

  const refrescarEntradasVideo = useCallback(async () => {
    const entradas = await getEntradasSesion(sesionId);
    if (sesionActualRef.current !== sesionId) return;
    aplicarEntradasVideoRefrescadas(
      entradas,
      animalSeleccionadoRef.current !== null,
      setEntradasSesion,
      setEvaluacionesPersistidas,
    );
  }, [sesionId]);

  const seleccionarAnimal = (animal: Animal | null) => {
    animalSeleccionadoRef.current = animal;
    setAnimalSeleccionado(animal);
  };

  const handleCerrarDialogEvaluacion = () => {
    seleccionarAnimal(null);
    const requestRefresh = requestVideoEntriesRefreshRef.current;
    if (requestRefresh) {
      void requestRefresh().catch(() => {
        // The recovery panel keeps the request pending and exposes its retry action.
      });
    } else {
      void refrescarEntradasVideo().catch(() =>
        toast.error("No se pudieron actualizar los ingresos. Volvé a cargar la sesión."),
      );
    }
  };

  const registrarRefrescoEntradasVideo = useCallback(
    (request: (() => Promise<void>) | null) => {
      requestVideoEntriesRefreshRef.current = request;
    },
    [],
  );

  const {
    caravanaInput,
    raza,
    estado,
    loteId,
    categoriaLote,
    setCaravanaInput,
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
    Promise.allSettled([getSesion(sesionId), getEntradasSesion(sesionId)])
      .then(([sesionResult, entradasResult]) => {
        if (sesionActualRef.current !== sesionId) return;
        if (sesionResult.status === "rejected") {
          toast.error("No se pudo cargar la sesión.");
          return;
        }
        const sesionData = sesionResult.value;
        setSesion(sesionData);
        setFechaSesionInput(sesionData.fecha_inicio.slice(0, 10));
        if (entradasResult.status === "fulfilled") {
          setEntradasSesion(entradasResult.value);
          setEvaluacionesPersistidas(
            new Map(entradasResult.value.items.map((item) => [item.animal_id, item])),
          );
        } else {
          toast.error("No se pudieron cargar los ingresos. Se intentará recuperarlos automáticamente.");
        }
      })
      .finally(() => {
        if (sesionActualRef.current === sesionId) setLoading(false);
      });
  }, [sesionId]);

  // Los mismos filtros que la página de animales (caravana, raza, estado,
  // lote), para encontrar rápido a quién falta evaluar en la sesión.
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
          const actualizada = await updateEvaluacionCcEnSesion(
            existente.id,
            sesionId,
            {
              observaciones: data.observaciones,
              ...(data.valorCc !== null ? { valor_cc: data.valorCc } : {}),
            },
          );
          setEvaluacionesPersistidas((prev) =>
            new Map(prev).set(animalId, actualizada),
          );
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
        const { evaluacion, imagenesError } =
          await registrarEvaluacionCCCompleta({
            sesionId,
            animalId,
            valorCc: data.valorCc,
            escalaMin: data.escalaMin,
            escalaMax: data.escalaMax,
            observaciones: data.observaciones,
            fecha: data.fecha,
            files: data.files,
          });
        setEvaluacionesPersistidas((prev) =>
          new Map(prev).set(animalId, evaluacion),
        );

        if (imagenesError) {
          toast.error(imagenesError);
        } else {
          toast.success(
            data.files.length > 0
              ? evaluacion.valor_cc == null
                ? "Ingreso registrado e imágenes subidas. La evaluación sigue pendiente de CC."
                : `Ingreso registrado e imágenes subidas. CC registrada: ${evaluacion.valor_cc}.`
              : evaluacion.valor_cc == null
                ? "Ingreso registrado como pendiente de CC."
                : "Ingreso y evaluación registrados.",
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

  const fechaGuardada = sesion.fecha_inicio.slice(0, 10);
  const fechaCambiada = !!fechaSesionInput && fechaSesionInput !== fechaGuardada;

  const animalesListados = gruposFiltrados.flatMap((grupo) =>
    grupo.animales.map((animal) => ({ animal, lote: grupo.lote })),
  );
  const evaluadosListados = animalesListados.filter(({ animal }) =>
    evaluacionesPersistidas.has(animal.id),
  ).length;
  const pendientesListados = animalesListados.length - evaluadosListados;
  const porcentaje =
    animalesListados.length > 0
      ? Math.round((evaluadosListados / animalesListados.length) * 100)
      : 0;
  const filas = animalesListados.filter(({ animal }) => {
    if (vista === "todos") return true;
    const evaluado = evaluacionesPersistidas.has(animal.id);
    return vista === "evaluados" ? evaluado : !evaluado;
  });
  const cantidadEvaluaciones = evaluacionesPersistidas.size;

  return (
    <section className="carga-sesion">
      <header className="carga-sesion__hero">
        <div className="carga-sesion__titulo">
          <span className="carga-sesion__eyebrow">
            <span className="carga-sesion__pulso" aria-hidden="true" />
            Sesión en carga
          </span>
          <h1>Evaluación del {fechaLarga(sesion.fecha_inicio)}</h1>
          <div className="carga-sesion__fecha">
            <label htmlFor="fecha-sesion">Fecha de la sesión</label>
            <FechaInput
              id="fecha-sesion"
              aria-label="Fecha a la que pertenece la sesión"
              className="carga-sesion__fecha-input"
              max={hoyStr}
              value={fechaSesionInput}
              onChange={setFechaSesionInput}
            />
            {fechaCambiada && (
              <Button
                colorPalette="brand"
                size="sm"
                onClick={handleConfirmarFechaSesion}
                loading={isActualizandoFecha}>
                Guardar fecha
              </Button>
            )}
          </div>
        </div>
        <div className="carga-sesion__acciones">
          <button
            type="button"
            className="animal-detail__action animal-detail__action--danger"
            onClick={() => setConfirmDeleteSesion(true)}>
            <IconTrash size={16} stroke={1.5} />
            Eliminar sesión
          </button>
          <span
            title={
              cantidadEvaluaciones === 0
                ? "Cargá al menos una evaluación para finalizar."
                : undefined
            }>
            <Button
              colorPalette="brand"
              size="lg"
              onClick={handleFinalizarCarga}
              loading={isFinalizando}
              loadingText="Guardando..."
              disabled={cantidadEvaluaciones === 0}>
              <IconCheck size={18} stroke={2} />
              Finalizar carga
            </Button>
          </span>
        </div>
      </header>

      <div className="carga-sesion__progreso">
        <div className="carga-sesion__progreso-numero">
          <strong>{cantidadEvaluaciones}</strong>
          <span>
            {cantidadEvaluaciones === 1
              ? "ingreso registrado"
              : "ingresos registrados"}
          </span>
        </div>
        <div className="carga-sesion__progreso-detalle">
          <div className="carga-sesion__progreso-texto">
            <span>
              {pendientesListados === 0 && animalesListados.length > 0
                ? "Todos los animales de la lista tienen un ingreso registrado"
                : `Faltan ${pendientesListados} de ${animalesListados.length} ${
                    animalesListados.length === 1 ? "animal" : "animales"
                  } de la lista`}
            </span>
            <strong>{porcentaje}%</strong>
          </div>
          <div
            className="carga-sesion__barra"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={porcentaje}
            aria-label="Animales de la lista evaluados">
            <div style={{ width: `${porcentaje}%` }} />
          </div>
        </div>
      </div>

      <AnalisisVideoSesion
        key={`${usuarioId}-${sesionId}`}
        sesionId={sesionId}
        sesionAbierta={sesion.estado === "ABIERTA"}
        ordenDisponible={entradasSesion.orden_disponible}
        entradasCount={entradasSesion.items.filter((item) => item.estado !== "ANULADA").length}
        onResultadosActualizados={refrescarEntradasVideo}
        onRegistrarRefrescoEntradas={registrarRefrescoEntradasVideo}
      />

      <div className="carga-sesion__lista">
        <div className="carga-sesion__toolbar">
          <div className="carga-sesion__vistas" role="group" aria-label="Mostrar">
            {VISTAS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={vista === value}
                data-activo={vista === value}
                onClick={() => setVista(value)}>
                {label}
                <span className="carga-sesion__vistas-cantidad">
                  {value === "todos"
                    ? animalesListados.length
                    : value === "evaluados"
                      ? evaluadosListados
                      : pendientesListados}
                </span>
              </button>
            ))}
          </div>
          <AnimalesFiltros
            caravanaInput={caravanaInput}
            raza={raza}
            estado={estado}
            loteId={loteId}
            categoriaLote={categoriaLote}
            lotes={lotes}
            loadingLotes={loadingLotes}
            onCaravanaChange={setCaravanaInput}
            onRazaChange={setRaza}
            onEstadoChange={setEstado}
            onLoteChange={setLoteId}
            onCategoriaLoteChange={setCategoriaLote}
          />
        </div>

        <div
          className="carga-sesion__tabla"
          style={{
            opacity: refetchingGrupos ? 0.6 : 1,
            transition: "opacity 160ms",
          }}>
          <Table.Root className="animales-table" interactive>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Ingreso</Table.ColumnHeader>
                <Table.ColumnHeader>Caravana</Table.ColumnHeader>
                <Table.ColumnHeader>Raza</Table.ColumnHeader>
                <Table.ColumnHeader>Lote</Table.ColumnHeader>
                <Table.ColumnHeader>Categoría del lote</Table.ColumnHeader>
                <Table.ColumnHeader>Condición corporal</Table.ColumnHeader>
                <Table.ColumnHeader aria-label="Acción" />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filas.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={7} className="carga-sesion__vacio">
                    {vista === "pendientes" && animalesListados.length > 0
                      ? "No quedan animales pendientes en la lista."
                      : vista === "evaluados"
                        ? "Todavía no hay animales evaluados en la lista."
                        : "No se encontraron animales con los filtros aplicados."}
                  </Table.Cell>
                </Table.Row>
              ) : (
                filas.map(({ animal, lote }) => {
                  const evaluacion = evaluacionesPersistidas.get(animal.id);
                  const caravana = animal.caravana ?? `#${animal.id}`;
                  return (
                    <Table.Row
                      key={animal.id}
                      className={`animales-table__row carga-sesion__fila${
                        evaluacion ? " carga-sesion__fila--evaluada" : ""
                      }`}
                      tabIndex={0}
                      role="button"
                      aria-label={`${evaluacion ? "Editar" : "Evaluar"} a ${caravana}`}
                      onClick={() => seleccionarAnimal(animal)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          seleccionarAnimal(animal);
                        }
                      }}>
                      <Table.Cell>
                        {evaluacion?.orden_entrada != null
                          ? `#${evaluacion.orden_entrada}`
                          : evaluacion
                            ? "Orden histórico desconocido"
                            : "—"}
                      </Table.Cell>
                      <Table.Cell className="carga-sesion__caravana">
                        {caravana}
                      </Table.Cell>
                      <Table.Cell>{animal.raza}</Table.Cell>
                      <Table.Cell>{lote?.nombre ?? "Sin lote"}</Table.Cell>
                      <Table.Cell>
                        {lote
                          ? (CATEGORIA_ANIMAL_LABELS[lote.categoria] ?? "—")
                          : "—"}
                      </Table.Cell>
                      <Table.Cell>
                        {evaluacion?.valor_cc != null ? (
                          <span
                            className={`animal-evaluaciones-table__cc animal-evaluaciones-table__cc--${nivelCC(
                              evaluacion.valor_cc,
                              evaluacion.fecha,
                            )}`}>
                            CC {evaluacion.valor_cc}
                          </span>
                        ) : evaluacion ? (
                          <span className="carga-sesion__sin-evaluar">
                            Pendiente de CC
                          </span>
                        ) : (
                          <span className="carga-sesion__sin-evaluar">
                            Sin evaluar
                          </span>
                        )}
                      </Table.Cell>
                      <Table.Cell className="carga-sesion__accion">
                        <span>{evaluacion ? "Editar" : "Evaluar"}</span>
                        <IconChevronRight size={16} stroke={1.75} />
                      </Table.Cell>
                    </Table.Row>
                  );
                })
              )}
            </Table.Body>
          </Table.Root>
        </div>
      </div>

      <RegistrarEvaluacionCCDialog
        animal={animalSeleccionado}
        open={!!animalSeleccionado}
        evaluacionExistente={
          animalSeleccionado
            ? (evaluacionesPersistidas.get(animalSeleccionado.id) ?? null)
            : null
        }
        fechaBase={fechaEvaluacionBase}
        onClose={handleCerrarDialogEvaluacion}
        onGuardar={handleGuardarEvaluacion}
        onEvaluacionActualizada={(evaluacion) =>
          setEvaluacionesPersistidas((prev) =>
            new Map(prev).set(evaluacion.animal_id, evaluacion),
          )
        }
      />

      <Dialog.Root
        open={confirmDeleteSesion}
        onOpenChange={(details) =>
          !details.open && setConfirmDeleteSesion(false)
        }>
        <Portal>
          <Dialog.Backdrop className="animal-evaluacion__backdrop" />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Eliminar sesión</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                Se eliminará la sesión #{sesionId} y todas las evaluaciones
                cargadas hasta ahora. Esta acción no se puede deshacer.
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
