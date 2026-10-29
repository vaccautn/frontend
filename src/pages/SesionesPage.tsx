import { useCallback, useEffect, useState } from "react";
import { Button, Dialog, Portal } from "@chakra-ui/react";
import {
  crearSesion,
  eliminarSesion,
  getTodasLasSesionesConResumen,
} from "@/features/sesiones/services/sesionesService";
import type { SesionCapturaConResumen } from "@/features/sesiones/types";
import { useSesionesFiltros } from "@/features/sesiones/hooks/useSesionesFiltros";
import "@/features/animales/components/animales.css";
import "@/features/sesiones/components/sesiones.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { IconPlus } from "@tabler/icons-react";
import { SesionesFiltros } from "../features/sesiones/components/SesionesFiltros";
import { SesionesTimeline } from "@/features/sesiones/components/SesionesTimeline";
import { SesionDetalle } from "@/features/sesiones/components/SesionDetalle";
import { localNaiveNow } from "@/utils/localDateTime";
import { ApiError } from "@/services/httpClient";

/** La sesión que se muestra si no se eligió ninguna: la más reciente que ya
 * no está en carga (una abierta se continúa en /cargar, no se detalla acá). */
function sesionPorDefecto(sesiones: SesionCapturaConResumen[]) {
  return [...sesiones]
    .filter((s) => s.estado !== "ABIERTA")
    .sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio))[0];
}

export function SesionesPage() {
  const [sesiones, setSesiones] = useState<SesionCapturaConResumen[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isStarting, setIsStarting] = useState(false);
  const [sesionAbierta, setSesionAbierta] = useState<number | null>(null);
  const { fechaDesde, fechaHasta, params, setFechaDesde, setFechaHasta, clearFilters } =
    useSesionesFiltros();

  const handleIniciarSesion = async () => {
    setIsStarting(true);
    try {
      const nuevaSesion = await crearSesion({ fecha_inicio: localNaiveNow() });
      navigate(`/sesiones/${nuevaSesion.id}/cargar`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409 && error.data?.sesion_id) {
        setSesionAbierta(error.data.sesion_id);
      } else {
        toast.error("No se pudo iniciar la sesión de evaluación.");
      }
    } finally {
      setIsStarting(false);
    }
  };

  const descartarEIniciar = async () => {
    if (sesionAbierta === null) return;
    setIsStarting(true);
    try {
      await eliminarSesion(sesionAbierta);
      const nuevaSesion = await crearSesion({ fecha_inicio: localNaiveNow() });
      navigate(`/sesiones/${nuevaSesion.id}/cargar`);
    } catch {
      toast.error("No se pudo descartar la sesión abierta.");
    } finally {
      setIsStarting(false);
      setSesionAbierta(null);
    }
  };

  const fetchSesiones = useCallback(() => {
    setRefetching(true);
    setError("");
    getTodasLasSesionesConResumen(params)
      .then(setSesiones)
      .catch(() => setError("No se pudieron cargar las sesiones."))
      .finally(() => {
        setRefetching(false);
        setInitialLoading(false);
      });
  }, [params]);

  useEffect(() => {
    fetchSesiones();
  }, [fetchSesiones]);

  // La sesión elegida vive en la URL (?sesion=ID) para poder volver a ella.
  const idEnUrl = Number(searchParams.get("sesion"));
  const seleccionada =
    sesiones.find((s) => s.id === idEnUrl && s.estado !== "ABIERTA") ??
    sesionPorDefecto(sesiones);

  const handleSeleccionar = (sesion: SesionCapturaConResumen) => {
    if (sesion.estado === "ABIERTA") {
      navigate(`/sesiones/${sesion.id}/cargar`);
      return;
    }
    setSearchParams({ sesion: String(sesion.id) }, { replace: true });
  };

  const handleEliminada = () => {
    setSearchParams({}, { replace: true });
    fetchSesiones();
  };

  return (
    <section>
      <div className="section-header">
        <div className="titulo-con-accion">
          <h1>Sesiones de evaluación</h1>
          <Button
            colorPalette="brand"
            className="boton-agregar"
            onClick={handleIniciarSesion}
            loading={isStarting}>
            Iniciar sesión de evaluación
            <IconPlus size={18} stroke={2.25} />
          </Button>
        </div>
      </div>

      <SesionesFiltros
        fechaDesde={fechaDesde}
        fechaHasta={fechaHasta}
        onFechaDesdeChange={setFechaDesde}
        onFechaHastaChange={setFechaHasta}
        onClear={clearFilters}
      />

      {initialLoading && <p>Cargando...</p>}
      {error && <p className="status-message error">{error}</p>}

      {!initialLoading && !error && (
        <div
          style={{
            opacity: refetching ? 0.6 : 1,
            transition: "opacity 0.15s",
          }}>
          {sesiones.length === 0 ? (
            <p className="sesiones-timeline__detalle-vacio">
              No se encontraron sesiones con los filtros aplicados.
            </p>
          ) : (
            <SesionesTimeline
              sesiones={sesiones}
              seleccionadaId={seleccionada?.id ?? null}
              onSeleccionar={handleSeleccionar}
            />
          )}

          {seleccionada ? (
            <SesionDetalle
              key={seleccionada.id}
              sesionId={seleccionada.id}
              onEliminada={handleEliminada}
            />
          ) : (
            sesiones.length > 0 && (
              <p className="sesiones-timeline__detalle-vacio">
                Todavía no hay sesiones finalizadas para mostrar.
              </p>
            )
          )}
        </div>
      )}
      <Dialog.Root open={sesionAbierta !== null} onOpenChange={(details) => !details.open && setSesionAbierta(null)}>
        <Portal><Dialog.Backdrop /><Dialog.Positioner><Dialog.Content><Dialog.Header><Dialog.Title>Hay una sesión abierta</Dialog.Title></Dialog.Header><Dialog.Body>¿Querés continuar editándola o descartarla para iniciar una nueva?</Dialog.Body><Dialog.Footer><Button colorPalette="brand" onClick={() => sesionAbierta !== null && navigate(`/sesiones/${sesionAbierta}/cargar`)}>Continuar editando</Button><Button colorPalette="red" onClick={descartarEIniciar}>Descartar e iniciar nueva</Button></Dialog.Footer></Dialog.Content></Dialog.Positioner></Portal>
      </Dialog.Root>
    </section>
  );
}
