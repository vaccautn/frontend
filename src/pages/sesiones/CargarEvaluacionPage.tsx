import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Table } from "@chakra-ui/react";
import { toast } from "react-toastify";
import { getSesion } from "@/features/sesiones/services/sesionesService";
import {
  getAnimalesAgrupadosPorLote,
  getEvaluacionesCc,
  registrarEvaluacionCCCompleta,
  updateEvaluacionCcEnSesion,
} from "@/features/animales/services/animalesService";
import { actualizarSesion } from "@/features/sesiones/services/sesionesService";
import {
  RegistrarEvaluacionCCDialog,
  type EvaluacionCCPendiente,
} from "@/pages/animales/RegistrarEvaluacionCCDialog"; // ajustar ruta real
import type { SesionCapturaRead } from "@/features/sesiones/types";
import type { Animal, AnimalLoteGroup, EvaluacionCC } from "@/features/animales/types";
import { localNaiveNow } from "@/utils/localDateTime";
import { ApiError } from "@/services/httpClient";

export function CargarEvaluacionesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sesionId = Number(id);

  const [sesion, setSesion] = useState<SesionCapturaRead | null>(null);
  const [grupos, setGrupos] = useState<AnimalLoteGroup[]>([]);
  const [animalSeleccionado, setAnimalSeleccionado] = useState<Animal | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [isFinalizando, setIsFinalizando] = useState(false);

  // Evaluaciones cargadas en memoria, todavía no persistidas en el backend.
  const [evaluaciones, setEvaluaciones] = useState<
    Map<number, EvaluacionCCPendiente>
  >(new Map());
  const [evaluacionesPersistidas, setEvaluacionesPersistidas] = useState<Map<number, EvaluacionCC>>(new Map());

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getSesion(sesionId),
      getAnimalesAgrupadosPorLote({ estado: "ACTIVO" }),
      getEvaluacionesCc({ sesionId }),
    ])
      .then(([sesionData, gruposData, evaluacionesData]) => {
        setSesion(sesionData);
        setGrupos(gruposData);
        setEvaluacionesPersistidas(new Map(evaluacionesData.map((item) => [item.animal_id, item])));
      })
      .catch(() => toast.error("No se pudo cargar la sesión."))
      .finally(() => setLoading(false));
  }, [sesionId]);

  const handleGuardarEvaluacion = useCallback(
    async (data: EvaluacionCCPendiente) => {
      if (!animalSeleccionado) return;
      const existente = evaluacionesPersistidas.get(animalSeleccionado.id);
      if (existente) {
        try {
          const actualizada = await updateEvaluacionCcEnSesion(existente.id, sesionId, {
            valor_cc: data.valorCc,
            observaciones: data.observaciones,
          });
          setEvaluacionesPersistidas((prev) => new Map(prev).set(animalSeleccionado.id, actualizada));
          toast.success("Evaluacion actualizada.");
        } catch {
          toast.error("No se pudo actualizar la evaluacion.");
        }
        setAnimalSeleccionado(null);
        return;
      }
      setEvaluaciones((prev) => {
        const next = new Map(prev);
        next.set(animalSeleccionado.id, data);
        return next;
      });
      setAnimalSeleccionado(null);
    },
    [animalSeleccionado, evaluacionesPersistidas, sesionId],
  );

  const handleFinalizarCarga = useCallback(async () => {
    setIsFinalizando(true);
    const entries = Array.from(evaluaciones.entries());

    const resultados = await Promise.allSettled(
      entries.map(async ([animalId, data]) => {
        const { imagenesConError } = await registrarEvaluacionCCCompleta({
          sesionId,
          animalId,
          valorCc: data.valorCc,
          escalaMin: data.escalaMin,
          escalaMax: data.escalaMax,
          observaciones: data.observaciones,
          fecha: data.fecha,
          files: data.files,
        });
        return { animalId, imagenesConError };
      }),
    );

    const exitosos = new Set<number>();
    const fallidos: number[] = [];
    let algunaImagenConError = false;

    resultados.forEach((res, idx) => {
      const [animalId] = entries[idx];
      if (res.status === "fulfilled") {
        exitosos.add(animalId);
        if (res.value.imagenesConError) algunaImagenConError = true;
      } else {
        fallidos.push(animalId);
      }
    });

    if (fallidos.length > 0) {
      // Sacamos las que sí se guardaron para no reenviarlas de nuevo.
      // No cerramos la sesión: queda abierta para que el usuario reintente.
      setEvaluaciones((prev) => {
        const next = new Map(prev);
        exitosos.forEach((id) => next.delete(id));
        return next;
      });
      setIsFinalizando(false);
      toast.error(
        `No se pudieron guardar ${fallidos.length} de ${entries.length} evaluación(es). Revisá e intentá de nuevo.`,
      );
      return;
    }

    // Todas las evaluaciones se guardaron: limpiamos el estado local antes de
    // intentar cerrar la sesión para que, si el cierre falla y el usuario
    // reintenta, no se reenvíen evaluaciones que ya quedaron persistidas.
    setEvaluaciones(new Map());

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
          "Las evaluaciones se guardaron, pero ocurrió un error al cerrar la sesión. Revisá tu conexión e intentá finalizar de nuevo.",
        );
      }
      return;
    }

    setIsFinalizando(false);

    if (algunaImagenConError) {
      toast.warning(
        "Las evaluaciones se registraron, pero alguna imagen no pudo subirse.",
      );
    } else {
      toast.success("Sesión finalizada correctamente.");
    }
    navigate("/sesiones");
  }, [evaluaciones, sesionId, navigate]);

  if (loading) return <p>Cargando...</p>;
  if (!sesion) return <p>Sesión no encontrada.</p>;

  return (
    <section>
      <div className="section-header">
        <div className="title-and-description">
          <h1>Cargando evaluaciones — Sesión #{sesion.id}</h1>
          <p>{evaluaciones.size} evaluación(es) cargadas en esta sesión.</p>
        </div>
        <Button
          colorPalette="brand"
          onClick={handleFinalizarCarga}
          loading={isFinalizando}
          loadingText="Guardando...">
          Finalizar carga
        </Button>
      </div>

      <Table.Root className="animales-table" interactive>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Caravana</Table.ColumnHeader>
            <Table.ColumnHeader>Raza</Table.ColumnHeader>
            <Table.ColumnHeader>Lote</Table.ColumnHeader>
            <Table.ColumnHeader>Valor CC</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {grupos.flatMap((grupo) =>
            grupo.animales.map((animal) => (
              <Table.Row
                key={animal.id}
                className="animales-table__row"
                onClick={() => setAnimalSeleccionado(animal)}>
                <Table.Cell>{animal.caravana ?? "—"}</Table.Cell>
                <Table.Cell>{animal.raza}</Table.Cell>
                <Table.Cell>{grupo.lote?.nombre ?? "Sin lote"}</Table.Cell>
                <Table.Cell>
                  {evaluaciones.get(animal.id)?.valorCc ?? evaluacionesPersistidas.get(animal.id)?.valor_cc ?? "—"}
                </Table.Cell>
              </Table.Row>
            )),
          )}
        </Table.Body>
      </Table.Root>

      <RegistrarEvaluacionCCDialog
        animal={animalSeleccionado}
        open={!!animalSeleccionado}
        valorInicial={
          animalSeleccionado
            ? evaluaciones.get(animalSeleccionado.id) ?? (evaluacionesPersistidas.has(animalSeleccionado.id) ? {
                valorCc: evaluacionesPersistidas.get(animalSeleccionado.id)!.valor_cc,
                escalaMin: evaluacionesPersistidas.get(animalSeleccionado.id)!.escala_min,
                escalaMax: evaluacionesPersistidas.get(animalSeleccionado.id)!.escala_max,
                observaciones: evaluacionesPersistidas.get(animalSeleccionado.id)!.observaciones,
                fecha: evaluacionesPersistidas.get(animalSeleccionado.id)!.fecha,
                files: [],
              } : undefined)
            : undefined
        }
        onClose={() => setAnimalSeleccionado(null)}
        onGuardar={handleGuardarEvaluacion}
      />
    </section>
  );
}
