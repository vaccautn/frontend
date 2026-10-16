import { Button } from "@chakra-ui/react";
import { formatFecha } from "@/features/animales/utils/formatDate";
import { useServicioResumen } from "../../hooks/useServicioResumen";
import { ServicioResumenEstado } from "../detail/ServicioResumenEstado";
import { ServicioDetalleCompleto } from "./ServicioDetalleCompleto";
import { ESTADO_SERVICIO_LABELS } from "../../constants";

type Props = {
  servicioId: number | null;
  expandido: boolean;
  onToggleExpandido: () => void;
  onEliminado: () => void;
  onVerServicio: (id: number) => void;
};

export function ServicioResumenPanel({
  servicioId,
  expandido,
  onToggleExpandido,
  onEliminado,
  onVerServicio,
}: Props) {
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
    <div
      className={`servicio-resumen-panel${expandido ? " servicio-resumen-panel--expandido" : ""}`}>
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
          onClick={onToggleExpandido}>
          {expandido ? "← Volver a servicios" : "Ver detalle completo ⤢"}
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
        onCargarResultados={onToggleExpandido}
      />

      {expandido && (
        <ServicioDetalleCompleto
          servicioId={servicio.id}
          servicio={servicio}
          lotes={resumen.lotes}
          participantes={resumen.participantes}
          toros={resumen.toros}
          animalesPorLoteId={resumen.animalesPorLoteId}
          hayResultadosPendientes={resumen.hayResultadosPendientes}
          onRefetch={resumen.refetch}
          onServicioActualizado={resumen.setServicio}
          onParticipantesActualizados={resumen.setParticipantes}
          onTorosActualizados={resumen.setToros}
          onEliminado={onEliminado}
          onVerServicio={onVerServicio}
        />
      )}
    </div>
  );
}
