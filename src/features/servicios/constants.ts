import type { EstadoServicio } from "./types";

export const ESTADOS_SERVICIO = [
  { value: "PLANIFICADO", label: "Planificado" },
  { value: "EN_CURSO", label: "En curso" },
  { value: "FINALIZADO", label: "Finalizado" },
  { value: "CERRADO", label: "Cerrado" },
  { value: "CANCELADO", label: "Cancelado" },
] as const;

export const ESTADO_SERVICIO_LABELS: Record<string, string> =
  Object.fromEntries(ESTADOS_SERVICIO.map(({ value, label }) => [value, label]));

/** Transiciones que el productor puede elegir a mano. Espejo de
 * TRANSICIONES_MANUALES del backend (que es quien las valida): las
 * automáticas por fecha las hace el backend al consultar el servicio. */
export const TRANSICIONES_MANUALES_SERVICIO: Record<
  EstadoServicio,
  readonly EstadoServicio[]
> = {
  PLANIFICADO: ["EN_CURSO", "CANCELADO"],
  EN_CURSO: ["FINALIZADO", "CANCELADO"],
  FINALIZADO: ["CERRADO"],
  CERRADO: ["FINALIZADO"],
  CANCELADO: [],
};

/** Opciones del selector de estado: el estado actual más los permitidos. */
export function opcionesEstadoServicio(actual: EstadoServicio) {
  const permitidos = new Set<EstadoServicio>([
    actual,
    ...TRANSICIONES_MANUALES_SERVICIO[actual],
  ]);
  return ESTADOS_SERVICIO.filter(({ value }) => permitidos.has(value));
}

export const ESTADOS_RESULTADO_SERVICIO = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "PRENADA", label: "Preñada" },
  { value: "VACIA", label: "Vacía" },
  { value: "ABORTO", label: "Aborto" },
  { value: "PARIDA", label: "Parida" },
] as const;

export const ESTADO_RESULTADO_SERVICIO_LABELS: Record<string, string> =
  Object.fromEntries(
    ESTADOS_RESULTADO_SERVICIO.map(({ value, label }) => [value, label]),
  );
