import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Spinner } from "@chakra-ui/react";
import { IconArrowLeft } from "@tabler/icons-react";
import {
  getLotesServicio,
  getServicio,
} from "@/features/servicios/services/serviciosService";
import type { ServicioLotesAgrupados, ServicioRead } from "@/features/servicios/types";
import { ESTADO_SERVICIO_LABELS } from "@/features/servicios/constants";
import { CATEGORIA_ANIMAL_LABELS } from "@/features/animales/constants";
import { formatFecha } from "@/features/animales/utils/formatDate";
import { ApiError } from "@/services/httpClient";
import "@/features/animales/components/animales.css";
import "@/features/sesiones/components/sesiones.css";
import "@/features/servicios/components/servicios.css";

type DetailStatus = "loading" | "ready" | "error" | "not-found";

export function ServicioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const servicioId = Number(id);

  const [status, setStatus] = useState<DetailStatus>("loading");
  const [servicio, setServicio] = useState<ServicioRead | null>(null);
  const [lotes, setLotes] = useState<ServicioLotesAgrupados | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(async () => {
      if (!Number.isInteger(servicioId) || servicioId <= 0) {
        if (!cancelled) setStatus("not-found");
        return;
      }

      setStatus("loading");

      try {
        const [servicioData, lotesData] = await Promise.all([
          getServicio(servicioId),
          getLotesServicio(servicioId),
        ]);
        if (cancelled) return;
        setServicio(servicioData);
        setLotes(lotesData);
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) {
          setStatus("not-found");
          return;
        }
        setErrorMessage(
          error instanceof ApiError
            ? error.detail
            : "No se pudo cargar el detalle del servicio.",
        );
        setStatus("error");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [servicioId]);

  return (
    <section className="sesion-detail" aria-label="Detalle de servicio">
      <Button
        colorPalette="brand"
        variant="ghost"
        className="sesion-detail__back"
        onClick={() => navigate("/servicios")}>
        <IconArrowLeft size={16} stroke={1.5} />
        Volver a servicios
      </Button>

      {status === "loading" && (
        <div className="sesion-detail__state" role="status" aria-live="polite">
          <Spinner size="md" />
          <p>Cargando detalle del servicio...</p>
        </div>
      )}

      {status === "not-found" && (
        <div className="sesion-detail__state" role="alert">
          <h1>El servicio ya no está disponible</h1>
          <p>Volvé al listado para consultar los servicios disponibles.</p>
        </div>
      )}

      {status === "error" && (
        <div className="sesion-detail__state" role="alert">
          <h1>No pudimos cargar el servicio</h1>
          <p>{errorMessage}</p>
        </div>
      )}

      {status === "ready" && servicio && (
        <>
          <header className="sesion-detail__hero">
            <div>
              <span className="sesion-detail__eyebrow">Servicio</span>
              <h1>{servicio.nombre || `Servicio #${servicio.id}`}</h1>
              <p>
                Inicio: {formatFecha(servicio.fecha_inicio)}
                {servicio.fecha_fin
                  ? ` · Fin: ${formatFecha(servicio.fecha_fin)}`
                  : ""}
              </p>
            </div>
            <div className="sesion-detail__hero-actions">
              <span
                className={`servicio-badge servicio-badge--${servicio.estado}`}>
                {ESTADO_SERVICIO_LABELS[servicio.estado] ?? servicio.estado}
              </span>
            </div>
          </header>

          {servicio.observaciones && (
            <div className="servicio-detail__observaciones">
              <h2>Observaciones</h2>
              <p>{servicio.observaciones}</p>
            </div>
          )}

          <div className="servicio-detail__lotes">
            <LotesGrupo titulo="Vientres" lotes={lotes?.vientres ?? []} />
            <LotesGrupo titulo="Toros" lotes={lotes?.toros ?? []} />
          </div>
        </>
      )}
    </section>
  );
}

type LotesGrupoProps = {
  titulo: string;
  lotes: ServicioLotesAgrupados["vientres"];
};

function LotesGrupo({ titulo, lotes }: LotesGrupoProps) {
  return (
    <div className="servicio-detail__lotes-grupo">
      <h2>
        {titulo} ({lotes.length})
      </h2>
      {lotes.length === 0 ? (
        <p className="servicio-detail__lote-categoria">
          No hay lotes de {titulo.toLowerCase()} asociados a este servicio.
        </p>
      ) : (
        <ul className="servicio-detail__lotes-lista">
          {lotes.map((lote) => (
            <li key={lote.id} className="servicio-detail__lote-item">
              <span>{lote.nombre}</span>
              <span className="servicio-detail__lote-categoria">
                {CATEGORIA_ANIMAL_LABELS[lote.categoria] ?? lote.categoria}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
