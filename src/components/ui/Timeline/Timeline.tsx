import { useMemo } from "react";
import type { TimelinePeriod, TimelineProps, TimelineStatus } from "./Timeline.types";
import {
  ALTO_LANE_PX,
  asignarLanes,
  calcularAnchoTotalPx,
  calcularLimitesEscala,
  calcularPosicionHoy,
  calcularPosicionPeriodo,
  contarLanes,
  generarColumnasTiempo,
} from "./timeline.utils";
import "./timeline.css";

const ESTADOS_LEYENDA: { status: TimelineStatus; label: string }[] = [
  { status: "planned", label: "Planificado" },
  { status: "in_progress", label: "En curso" },
  { status: "completed", label: "Finalizado" },
  { status: "closed", label: "Cerrado" },
];

const LABEL_POR_ESTADO: Record<TimelineStatus, string> = {
  planned: "Planificado",
  in_progress: "En curso",
  completed: "Finalizado",
  closed: "Cerrado",
};

export function Timeline({
  periods,
  currentDate,
  startDate,
  endDate,
  showToday = true,
  showLegend = true,
  className,
  onPeriodClick,
  selectedId,
}: TimelineProps) {
  const today = useMemo(() => currentDate ?? new Date(), [currentDate]);

  const limites = useMemo(
    () => calcularLimitesEscala(periods, today, startDate, endDate),
    [periods, today, startDate, endDate],
  );

  const columnas = useMemo(() => generarColumnasTiempo(limites), [limites]);

  const periodosConLane = useMemo(() => asignarLanes(periods), [periods]);

  const posicionesPorId = useMemo(() => {
    const mapa = new Map<string, { left: number; width: number }>();
    for (const period of periods) {
      const pos = calcularPosicionPeriodo(period, limites);
      if (pos) mapa.set(period.id, pos);
    }
    return mapa;
  }, [periods, limites]);

  const hoyPct = useMemo(() => calcularPosicionHoy(today, limites), [today, limites]);

  const anchoTotalPx = useMemo(() => calcularAnchoTotalPx(limites), [limites]);

  const totalLanes = contarLanes(periodosConLane);

  return (
    <div className={`timeline${className ? ` ${className}` : ""}`}>
      <header className="timeline__header">
        <span className="timeline__titulo">Línea de tiempo</span>
        {showLegend && (
          <div className="timeline__leyenda">
            {ESTADOS_LEYENDA.map(({ status, label }) => (
              <span key={status} className="timeline__leyenda-item">
                <span className="timeline__leyenda-dot" data-status={status} />
                {label}
              </span>
            ))}
          </div>
        )}
      </header>

      {periods.length === 0 ? (
        <p className="timeline__vacio">No hay períodos para mostrar.</p>
      ) : (
        <div className="timeline__scroll">
          <div className="timeline__area" style={{ minWidth: `${anchoTotalPx}px` }}>
            <div
              className="timeline__escala"
              style={{ gridTemplateColumns: `repeat(${columnas.length}, 1fr)` }}>
              {columnas.map((col) => (
                <div
                  key={col.key}
                  className="timeline__columna"
                  data-inicio-anio={col.esInicioAnio}>
                  <span className="timeline__anio">{col.anioLabel}</span>
                  <span className="timeline__mes">{col.mesLabel}</span>
                </div>
              ))}
            </div>

            <div
              className="timeline__carriles"
              style={{ height: `${Math.max(1, totalLanes) * ALTO_LANE_PX}px` }}>
              {periodosConLane.map(({ period, lane }) => {
                const pos = posicionesPorId.get(period.id);
                if (!pos) return null;

                const interactiva = Boolean(onPeriodClick);
                const handleClick = onPeriodClick
                  ? () => onPeriodClick(period.id)
                  : undefined;

                return (
                  <div
                    key={period.id}
                    className="timeline__barra"
                    data-status={period.status}
                    data-seleccionado={period.id === selectedId}
                    data-interactiva={interactiva}
                    role={interactiva ? "button" : undefined}
                    tabIndex={interactiva ? 0 : undefined}
                    title={period.name}
                    aria-label={`${period.name}: ${LABEL_POR_ESTADO[period.status]}`}
                    style={{ left: `${pos.left}%`, width: `${pos.width}%`, top: `${lane * ALTO_LANE_PX}px` }}
                    onClick={handleClick}
                    onKeyDown={
                      interactiva
                        ? (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              handleClick?.();
                            }
                          }
                        : undefined
                    }>
                    <span className="timeline__barra-texto">{period.name}</span>
                  </div>
                );
              })}
            </div>

            {showToday && hoyPct !== null && (
              <div className="timeline__hoy" style={{ left: `${hoyPct}%` }}>
                <span>HOY</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export type { TimelinePeriod, TimelineProps, TimelineStatus };
