import type { ServicioRead } from "@/features/servicios/types";

function parseFechaSolo(fecha: string): Date {
  const [year, month, day] = fecha.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function hoySinHora(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * El backend no transiciona automáticamente PLANIFICADO -> EN_CURSO cuando
 * llega la fecha de inicio (es un campo que se setea a mano). Para no
 * mostrar como "sin actividad" un servicio cuyo rango de fechas ya arrancó
 * simplemente porque nadie actualizó el estado a mano, se considera activo
 * hoy a todo servicio no CANCELADO/FINALIZADO cuyo rango [fecha_inicio,
 * fecha_fin] incluya la fecha actual — independientemente del valor
 * literal de `estado`.
 */
export function estaActivoHoy(servicio: ServicioRead): boolean {
  if (servicio.estado === "CANCELADO" || servicio.estado === "FINALIZADO") {
    return false;
  }

  const hoy = hoySinHora();
  const inicio = parseFechaSolo(servicio.fecha_inicio);
  if (hoy < inicio) return false;

  if (servicio.fecha_fin) {
    const fin = parseFechaSolo(servicio.fecha_fin);
    if (hoy > fin) return false;
  }

  return true;
}
