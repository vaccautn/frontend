import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Dialog, Portal, Spinner } from "@chakra-ui/react";
import { toast } from "react-toastify";
import { IconTrash } from "@tabler/icons-react";
import { normalizeBackendDetail } from "@/features/auth";
import {
  anularEvaluacionCcEnSesion,
  getEvaluacionesCc,
  updateEvaluacionCcEnSesion,
} from "@/features/animales/services/animalesService";
import type {
  EvaluacionCC,
  UpdateEvaluacionCCSesionPayload,
} from "@/features/animales/types";
import { eliminarSesion, getSesion } from "@/features/sesiones/services/sesionesService";
import type { SesionCapturaRead } from "@/features/sesiones/types";
import { SesionDashboard } from "@/features/sesiones/components/dashboard/SesionDashboard";
import { RecomendacionesPanel } from "@/features/recomendaciones/components/RecomendacionesPanel";
import { getRecomendacionesSesion } from "@/features/recomendaciones/services/recomendacionesService";
import type { AptitudVaca } from "@/features/recomendaciones/types";
import { useSesionDashboard } from "@/features/sesiones/hooks/useSesionDashboard";
import { ApiError } from "@/services/httpClient";
import { formatEventDate, formatEventDateTime } from "@/utils/localDateTime";
import { ConfirmarEliminacionDialog } from "./ConfirmarEliminacionDialog";
import { EditarEvaluacionDialog } from "./EditarEvaluacionDialog";
import { SesionEvaluacionesCards } from "./SesionEvaluacionesCards";
import "@/features/animales/components/animales.css";
import "@/features/sesiones/components/sesiones.css";

type DetailStatus = "loading" | "ready" | "error" | "stale" | "ineligible";

type Props = {
  sesionId: number;
  /** Se llama después de eliminar la sesión. */
  onEliminada: () => void;
};

/** Detalle de una sesión cerrada o cancelada: dashboard, recomendaciones y
 * evaluaciones. Se usa debajo de la línea de tiempo del listado y en la ruta
 * /sesiones/:id. */
export function SesionDetalle({ sesionId, onEliminada }: Props) {
  const requestGenerationRef = useRef(0);
  const activeSesionIdRef = useRef(sesionId);
  const [retryGeneration, setRetryGeneration] = useState(0);
  const [status, setStatus] = useState<DetailStatus>("loading");
  const [sesion, setSesion] = useState<SesionCapturaRead | null>(null);
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionCC[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingEvaluacion, setEditingEvaluacion] =
    useState<EvaluacionCC | null>(null);
  const [deletingEvaluacion, setDeletingEvaluacion] =
    useState<EvaluacionCC | null>(null);
  const [confirmDeleteSesion, setConfirmDeleteSesion] = useState(false);
  const [isDeletingSesion, setIsDeletingSesion] = useState(false);
  // Recomendaciones de la sesión (solo CERRADA): las usan el dashboard
  // ("Requieren medida") y el panel de recomendaciones.
  const [recVacas, setRecVacas] = useState<AptitudVaca[]>([]);
  const [recLoading, setRecLoading] = useState(true);
  const [recError, setRecError] = useState("");
  const dashboard = useSesionDashboard(sesionId);

  const cargarRecomendaciones = useCallback(() => {
    setRecError("");
    getRecomendacionesSesion(sesionId)
      .then(setRecVacas)
      .catch(() => setRecError("No se pudieron cargar las recomendaciones."))
      .finally(() => setRecLoading(false));
  }, [sesionId]);

  const sesionCerrada = status === "ready" && sesion?.estado === "CERRADA";
  // Se recarga cuando cambian las evaluaciones (editar una CC cambia sus
  // recomendaciones).
  useEffect(() => {
    if (!sesionCerrada) return;
    const timer = window.setTimeout(cargarRecomendaciones, 0);
    return () => window.clearTimeout(timer);
  }, [sesionCerrada, cargarRecomendaciones, evaluaciones]);

  useEffect(() => {
    activeSesionIdRef.current = sesionId;
    const requestGeneration = ++requestGenerationRef.current;
    let cancelled = false;

    const isCurrentRequest = () =>
      !cancelled && requestGenerationRef.current === requestGeneration;

    void Promise.resolve().then(async () => {
      if (!Number.isInteger(sesionId) || sesionId <= 0) {
        if (isCurrentRequest()) setStatus("stale");
        return;
      }

      setStatus("loading");
      setSesion(null);
      setEvaluaciones([]);
      setErrorMessage("");
      setEditingEvaluacion(null);
      setDeletingEvaluacion(null);

      try {
        const sesionResponse = await getSesion(sesionId);
        if (!isCurrentRequest()) return;

        // ABIERTA se edita en /cargar, no acá. CERRADA y CANCELADA sí se
        // pueden ver (y eliminar) desde esta pantalla, incluso sin
        // evaluaciones — una sesión cancelada o vaciada no debe quedar
        // atrapada sin forma de borrarla.
        if (sesionResponse.estado === "ABIERTA") {
          setSesion(sesionResponse);
          setStatus("ineligible");
          return;
        }

        let evaluacionesResponse: EvaluacionCC[] = [];
        try {
          evaluacionesResponse = await getEvaluacionesCc({ sesionId });
        } catch {
          evaluacionesResponse = [];
        }
        if (!isCurrentRequest()) return;

        setSesion(sesionResponse);
        setEvaluaciones(evaluacionesResponse);
        setStatus("ready");
      } catch (error) {
        if (!isCurrentRequest()) return;
        if (error instanceof ApiError && error.status === 404) {
          setStatus("stale");
          return;
        }
        if (error instanceof ApiError && error.status === 409) {
          setStatus("ineligible");
          return;
        }
        setErrorMessage(
          error instanceof ApiError
            ? normalizeBackendDetail(error.detail)
            : "No se pudo cargar el detalle de la sesión.",
        );
        setStatus("error");
      }
    });

    return () => {
      cancelled = true;
      if (requestGenerationRef.current === requestGeneration) {
        requestGenerationRef.current += 1;
      }
    };
  }, [retryGeneration, sesionId]);

  const handleEditSubmit = async (payload: UpdateEvaluacionCCSesionPayload) => {
    if (!editingEvaluacion) return false;
    const mutationGeneration = requestGenerationRef.current;
    const mutationSesionId = sesionId;

    try {
      await updateEvaluacionCcEnSesion(
        editingEvaluacion.id,
        mutationSesionId,
        payload,
      );
      if (
        mutationGeneration !== requestGenerationRef.current ||
        mutationSesionId !== activeSesionIdRef.current
      ) {
        return false;
      }

      const [sesionResponse, evaluacionesResponse] = await Promise.all([
        getSesion(mutationSesionId),
        getEvaluacionesCc({ sesionId: mutationSesionId }),
      ]);
      if (
        mutationGeneration !== requestGenerationRef.current ||
        mutationSesionId !== activeSesionIdRef.current
      ) {
        return false;
      }
      if (sesionResponse.estado !== "CERRADA") {
        setEditingEvaluacion(null);
        setSesion(sesionResponse);
        setStatus("ineligible");
        return false;
      }

      setSesion(sesionResponse);
      setEvaluaciones(evaluacionesResponse);
      dashboard.refetch();
      return true;
    } catch (error) {
      if (
        mutationGeneration === requestGenerationRef.current &&
        mutationSesionId === activeSesionIdRef.current &&
        error instanceof ApiError &&
        (error.status === 404 || error.status === 409)
      ) {
        setEditingEvaluacion(null);
        setRetryGeneration((value) => value + 1);
      }
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEvaluacion) return false;
    const mutationGeneration = requestGenerationRef.current;
    const mutationSesionId = sesionId;

    try {
      await anularEvaluacionCcEnSesion(deletingEvaluacion.id, mutationSesionId);
      if (
        mutationGeneration !== requestGenerationRef.current ||
        mutationSesionId !== activeSesionIdRef.current
      ) {
        return false;
      }

      const [sesionResponse, evaluacionesResponse] = await Promise.all([
        getSesion(mutationSesionId),
        getEvaluacionesCc({ sesionId: mutationSesionId }),
      ]);
      if (
        mutationGeneration !== requestGenerationRef.current ||
        mutationSesionId !== activeSesionIdRef.current
      ) {
        return false;
      }
      if (sesionResponse.estado !== "CERRADA") {
        setDeletingEvaluacion(null);
        setSesion(sesionResponse);
        setStatus("ineligible");
        return false;
      }

      setSesion(sesionResponse);
      setEvaluaciones(evaluacionesResponse);
      dashboard.refetch();
      return true;
    } catch (error) {
      if (
        mutationGeneration === requestGenerationRef.current &&
        mutationSesionId === activeSesionIdRef.current &&
        error instanceof ApiError &&
        (error.status === 404 || error.status === 409)
      ) {
        setDeletingEvaluacion(null);
        setRetryGeneration((value) => value + 1);
      }
      throw error;
    }
  };

  const handleDeleteSesion = async () => {
    setIsDeletingSesion(true);
    try {
      await eliminarSesion(sesionId);
      toast.success("Sesión eliminada correctamente.");
      setConfirmDeleteSesion(false);
      setIsDeletingSesion(false);
      onEliminada();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? normalizeBackendDetail(error.detail)
          : "No se pudo eliminar la sesión.",
      );
      setIsDeletingSesion(false);
      setConfirmDeleteSesion(false);
    }
  };

  const vacasConPendientes = sesionCerrada
    ? recVacas.filter((vaca) =>
        vaca.recomendaciones.some((r) => r.estado === "PENDIENTE"),
      )
    : [];
  // Los animales que ya aparecen como tarjeta de recomendación no se repiten
  // en "Resto de las evaluaciones".
  const conRecomendacion = new Set(vacasConPendientes.map((v) => v.animal.id));
  const restoEvaluaciones = evaluaciones.filter(
    (evaluacion) => !conRecomendacion.has(evaluacion.animal_id),
  );

  return (
    <section className="sesion-detail" aria-label="Detalle de sesión">
      {status === "loading" && (
        <div className="sesion-detail__state" role="status" aria-live="polite">
          <Spinner size="md" />
          <p>Cargando detalle de la sesión...</p>
        </div>
      )}

      {status === "stale" && (
        <div className="sesion-detail__state" role="alert">
          <h2 id="sesion-detail-title">La sesión ya no está disponible</h2>
          <p>Volvé al listado para consultar las sesiones disponibles.</p>
        </div>
      )}

      {status === "ineligible" && (
        <div className="sesion-detail__state" role="alert">
          <h2 id="sesion-detail-title">Esta sesión sigue abierta</h2>
          <p>
            Todavía se está cargando: hacé click en la sesión de la línea de
            tiempo para continuar la carga.
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="sesion-detail__state" role="alert">
          <h2 id="sesion-detail-title">No pudimos cargar la sesión</h2>
          <p>{errorMessage}</p>
          <Button
            colorPalette="brand"
            onClick={() => setRetryGeneration((value) => value + 1)}>
            Reintentar
          </Button>
        </div>
      )}

      {status === "ready" && sesion && (
        <>
          <header className="sesion-detail__hero">
            <div>
              <span className="sesion-detail__eyebrow">
                {sesion.estado === "CANCELADA" ? "Sesión cancelada" : "Sesión cerrada"}
              </span>
              <h2 id="sesion-detail-title">
                Evaluaciones de la sesión del {formatEventDate(sesion.fecha_inicio)}
              </h2>
              <p>{formatEventDateTime(sesion.fecha_inicio)}</p>
            </div>
            <div className="sesion-detail__hero-actions">
              <span className="sesion-detail__count">
                {evaluaciones.length} evaluación{evaluaciones.length === 1 ? "" : "es"}
              </span>
            </div>
          </header>

          <SesionDashboard
            data={dashboard.data}
            loading={dashboard.loading}
            error={dashboard.error}
            fecha={sesion.fecha_inicio}
            requierenMedida={vacasConPendientes}
            requierenMedidaLoading={sesionCerrada && recLoading}
          />

          {sesion.estado === "CERRADA" && (
            <RecomendacionesPanel
              vacas={recVacas}
              loading={recLoading}
              error={recError}
              onDecidido={cargarRecomendaciones}
            />
          )}

          {evaluaciones.length === 0 ? (
            <div className="sesion-detail__empty" role="status">
              <h2>No hay evaluaciones activas</h2>
              <p>
                Esta sesión no tiene evaluaciones para revisar. Podés
                eliminarla desde el botón de abajo.
              </p>
            </div>
          ) : (
            restoEvaluaciones.length > 0 && (
              <SesionEvaluacionesCards
                titulo={
                  restoEvaluaciones.length < evaluaciones.length
                    ? "Resto de las evaluaciones"
                    : "Evaluaciones"
                }
                evaluaciones={restoEvaluaciones}
                onEdit={setEditingEvaluacion}
              />
            )
          )}

          <button
            type="button"
            className="animal-detail__action animal-detail__action--danger sesion-detail__delete-trigger"
            onClick={() => setConfirmDeleteSesion(true)}>
            <IconTrash size={16} stroke={1.5} />
            Eliminar sesión
          </button>
        </>
      )}

      {editingEvaluacion && (
        <EditarEvaluacionDialog
          key={editingEvaluacion.id}
          evaluacion={editingEvaluacion}
          onClose={() => setEditingEvaluacion(null)}
          onSubmit={handleEditSubmit}
          onDelete={(evaluacion) => {
            setEditingEvaluacion(null);
            setDeletingEvaluacion(evaluacion);
          }}
        />
      )}
      {deletingEvaluacion && (
        <ConfirmarEliminacionDialog
          key={deletingEvaluacion.id}
          evaluacion={deletingEvaluacion}
          onClose={() => setDeletingEvaluacion(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

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
                Se eliminará la sesión #{sesionId} y todas sus evaluaciones. Esta acción no
                se puede deshacer.
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
