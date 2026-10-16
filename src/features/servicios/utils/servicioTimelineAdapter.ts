import type { TimelinePeriod, TimelineStatus } from "@/components/ui/Timeline/Timeline.types";
import type { EstadoServicio, ServicioRead } from "../types";

const ESTADO_A_TIMELINE_STATUS: Record<Exclude<EstadoServicio, "CANCELADO">, TimelineStatus> = {
  PLANIFICADO: "planned",
  EN_CURSO: "in_progress",
  FINALIZADO: "completed",
  CERRADO: "closed",
};

/** Parsea una fecha sin hora (ej. "2026-06-05") en el día local, evitando el
 * corrimiento que produce `new Date(string)` al interpretar strings
 * date-only como UTC (mismo patrón que `formatDate.ts`/`faseServicio.ts`). */
function parseFechaSolo(fecha: string): Date {
  const [year, month, day] = fecha.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Un servicio CANCELADO no existe para el usuario: nunca se muestra en el timeline. */
export function serviciosATimelinePeriods(servicios: ServicioRead[]): TimelinePeriod[] {
  return servicios
    .filter((s) => s.estado !== "CANCELADO")
    .map((s) => ({
      id: String(s.id),
      name: s.nombre,
      startDate: parseFechaSolo(s.fecha_inicio),
      endDate: parseFechaSolo(s.fecha_fin ?? s.fecha_inicio),
      status: ESTADO_A_TIMELINE_STATUS[s.estado as Exclude<EstadoServicio, "CANCELADO">],
    }));
}
