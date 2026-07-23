import { useEffect, useRef, useState } from "react";
import { Button, Spinner } from "@chakra-ui/react";
import { IconArrowLeft } from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";
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
import { getSesion } from "@/features/sesiones/services/sesionesService";
import type { SesionCapturaRead } from "@/features/sesiones/types";
import { ApiError } from "@/services/httpClient";
import { ConfirmarEliminacionDialog } from "./ConfirmarEliminacionDialog";
import { EditarEvaluacionDialog } from "./EditarEvaluacionDialog";
import { SesionEvaluacionRow } from "./SesionEvaluacionRow";
import "./sesiones.css";

type DetailStatus = "loading" | "ready" | "error" | "stale" | "ineligible";

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "long",
  timeStyle: "short",
});

export function SesionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sesionId = Number(id);
  const requestGenerationRef = useRef(0);
  const activeSesionIdRef = useRef(sesionId);
  const [retryGeneration, setRetryGeneration] = useState(0);
  const [status, setStatus] = useState<DetailStatus>("loading");
  const [sesion, setSesion] = useState<SesionCapturaRead | null>(null);
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionCC[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingEvaluacion, setEditingEvaluacion] = useState<EvaluacionCC | null>(null);
  const [deletingEvaluacion, setDeletingEvaluacion] = useState<EvaluacionCC | null>(null);

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

        if (sesionResponse.estado !== "CERRADA") {
          setSesion(sesionResponse);
          setStatus("ineligible");
          return;
        }

        const evaluacionesResponse = await getEvaluacionesCc({ sesionId });
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
      await anularEvaluacionCcEnSesion(
        deletingEvaluacion.id,
        mutationSesionId,
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
        setDeletingEvaluacion(null);
        setSesion(sesionResponse);
        setStatus("ineligible");
        return false;
      }

      setSesion(sesionResponse);
      setEvaluaciones(evaluacionesResponse);
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

  return (
    <section className="sesion-detail" aria-label="Detalle de sesión">
      <Button
        colorPalette="brand"
        variant="ghost"
        className="sesion-detail__back"
        onClick={() => navigate("/sesiones")}>
        <IconArrowLeft size={16} stroke={1.5} />
        Volver a sesiones
      </Button>

      {status === "loading" && (
        <div className="sesion-detail__state" role="status" aria-live="polite">
          <Spinner size="md" />
          <p>Cargando detalle de la sesión...</p>
        </div>
      )}

      {status === "stale" && (
        <div className="sesion-detail__state" role="alert">
          <h1 id="sesion-detail-title">La sesión ya no está disponible</h1>
          <p>Volvé al listado para consultar las sesiones disponibles.</p>
        </div>
      )}

      {status === "ineligible" && (
        <div className="sesion-detail__state" role="alert">
          <h1 id="sesion-detail-title">Esta sesión no admite revisión</h1>
          <p>Solo las sesiones cerradas permiten consultar sus evaluaciones.</p>
        </div>
      )}

      {status === "error" && (
        <div className="sesion-detail__state" role="alert">
          <h1 id="sesion-detail-title">No pudimos cargar la sesión</h1>
          <p>{errorMessage}</p>
          <Button colorPalette="brand" onClick={() => setRetryGeneration((value) => value + 1)}>
            Reintentar
          </Button>
        </div>
      )}

      {status === "ready" && sesion && (
        <>
          <header className="sesion-detail__hero">
            <div>
              <span className="sesion-detail__eyebrow">Sesión cerrada</span>
              <h1 id="sesion-detail-title">Evaluaciones de la sesión #{sesion.id}</h1>
              <p>{DATE_TIME_FORMATTER.format(new Date(sesion.fecha_inicio))}</p>
            </div>
            <span className="sesion-detail__count">
              {evaluaciones.length} evaluación{evaluaciones.length === 1 ? "" : "es"}
            </span>
          </header>

          {evaluaciones.length === 0 ? (
            <div className="sesion-detail__empty" role="status">
              <h2>No hay evaluaciones activas</h2>
              <p>Esta sesión cerrada no tiene evaluaciones para revisar.</p>
            </div>
          ) : (
            <ul className="sesion-detail__list" aria-label="Evaluaciones de la sesión">
              {evaluaciones.map((evaluacion) => (
                <li key={evaluacion.id}>
                  <SesionEvaluacionRow
                    evaluacion={evaluacion}
                    onEdit={() => setEditingEvaluacion(evaluacion)}
                    onDelete={() => setDeletingEvaluacion(evaluacion)}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {editingEvaluacion && (
        <EditarEvaluacionDialog
          key={editingEvaluacion.id}
          evaluacion={editingEvaluacion}
          onClose={() => setEditingEvaluacion(null)}
          onSubmit={handleEditSubmit}
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
    </section>
  );
}
