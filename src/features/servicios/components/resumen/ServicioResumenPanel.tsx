import { Button } from "@chakra-ui/react";
import { formatFecha } from "@/features/animales/utils/formatDate";
import { useServicioResumen } from "../../hooks/useServicioResumen";
import { ServicioResumenEstado } from "../detail/ServicioResumenEstado";
import { ESTADO_SERVICIO_LABELS } from "../../constants";

type Props = {
  servicioId: number | null;
  onVerDetalle: (id: number) => void;
};

export function ServicioResumenPanel({ servicioId, onVerDetalle }: Props) {
  const resumen = useServicioResumen(servicioId);

  if (servicioId === null || resumen.status === "idle") {
    return (
      <div className="servicio-resumen-panel">
        <p className="servicio-resumen-panel__vacio">
          Elegí un servicio de la lista o de la línea de tiempo para ver su resumen.
        </p>
      </div>
    );
  }

  if (resumen.status === "loading") {
    return (
      <div className="servicio-resumen-panel">
        <p className="status-message">Cargando...</p>
      </div>
    );
  }

  if (resumen.status === "error") {
    return (
      <div className="servicio-resumen-panel">
        <p className="status-message error" role="alert">
          {resumen.errorMessage}
        </p>
      </div>
    );
  }

  const { servicio } = resumen;
  if (!servicio) return null;

  return (
    <div className="servicio-resumen-panel">
      <div className="servicio-resumen-panel__header">
        <div>
          <div className="servicio-resumen-panel__titulo">
            <span className="servicio-resumen-panel__nombre">
              {servicio.nombre || `Servicio #${servicio.id}`}
            </span>
            <span className={`servicio-badge servicio-badge--${servicio.estado}`}>
              {ESTADO_SERVICIO_LABELS[servicio.estado] ?? servicio.estado}
            </span>
            {servicio.servicio_origen_id !== null && (
              <span className="servicio-resumen-panel__reservicio-tag">Reservicio</span>
            )}
          </div>
          <div className="servicio-resumen-panel__meta">
            {formatFecha(servicio.fecha_inicio)} –{" "}
            {servicio.fecha_fin ? formatFecha(servicio.fecha_fin) : "—"} ·{" "}
            {resumen.cantidadVacas} {resumen.cantidadVacas === 1 ? "vaca" : "vacas"}
          </div>
        </div>
        <Button
          colorPalette="brand"
          variant="outline"
          bg="var(--panel)"
          size="sm"
          onClick={() => onVerDetalle(servicio.id)}>
          Ver detalle completo
        </Button>
      </div>

      <ServicioResumenEstado
        servicio={servicio}
        lotes={resumen.lotes}
        participantes={resumen.participantes}
        toros={resumen.toros}
        animalesPorLoteId={resumen.animalesPorLoteId}
        cantidadVacas={resumen.cantidadVacas}
        loading={false}
        hayResultadosPendientes={resumen.hayResultadosPendientes}
        onCargarResultados={() => onVerDetalle(servicio.id)}
      />
    </div>
  );
}
