import type { TimelinePeriod, TimelineStatus } from "@/components/ui/Timeline/Timeline.types";
import type { EstadoServicio, ServicioRead } from "../types";

const ESTADO_A_TIMELINE_STATUS: Record<Exclude<EstadoServicio, "CANCELADO">, TimelineStatus> = {
  PLANIFICADO: "planned",
  EN_CURSO: "in_progress",
  FINALIZADO: "completed",
  CERRADO: "closed",
};

/** Un servicio CANCELADO no existe para el usuario: nunca se muestra en el timeline. */
export function serviciosATimelinePeriods(servicios: ServicioRead[]): TimelinePeriod[] {
  return servicios
    .filter((s) => s.estado !== "CANCELADO")
    .map((s) => ({
      id: String(s.id),
      name: s.nombre,
      startDate: new Date(s.fecha_inicio),
      endDate: new Date(s.fecha_fin ?? s.fecha_inicio),
      status: ESTADO_A_TIMELINE_STATUS[s.estado as Exclude<EstadoServicio, "CANCELADO">],
    }));
}
