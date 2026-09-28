import type { ServicioRead } from "@/features/servicios/types";

/**
 * Un servicio está activo hoy si está EN_CURSO. El backend transiciona
 * solo PLANIFICADO -> EN_CURSO -> FINALIZADO según las fechas cada vez que
 * se consulta el servicio, así que el estado que llega ya está al día.
 */
export function estaActivoHoy(servicio: ServicioRead): boolean {
  return servicio.estado === "EN_CURSO";
}
