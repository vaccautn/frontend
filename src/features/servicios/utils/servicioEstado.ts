import { actualizarServicio } from "@/features/servicios/services/serviciosService";
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

/**
 * Si el servicio está PLANIFICADO y su fecha de inicio ya llegó (es igual
 * o anterior a hoy), lo pasa a EN_CURSO de verdad contra el backend — el
 * backend no hace esta transición solo — y devuelve la versión
 * actualizada. Si no corresponde, o si falla el PATCH, devuelve el mismo
 * servicio sin tocar nada (no es un error bloqueante: el estado se vuelve
 * a intentar sincronizar la próxima vez que se cargue).
 */
export async function sincronizarEstadoServicio(
  servicio: ServicioRead,
): Promise<ServicioRead> {
  if (servicio.estado !== "PLANIFICADO") return servicio;

  const hoy = hoySinHora();
  const inicio = parseFechaSolo(servicio.fecha_inicio);
  if (hoy < inicio) return servicio;

  try {
    return await actualizarServicio(servicio.id, { estado: "EN_CURSO" });
  } catch {
    return servicio;
  }
}

/** Aplica sincronizarEstadoServicio a una lista completa en paralelo. */
export async function sincronizarEstadosServicios(
  servicios: ServicioRead[],
): Promise<ServicioRead[]> {
  return Promise.all(servicios.map(sincronizarEstadoServicio));
}
