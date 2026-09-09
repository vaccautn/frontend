export const ESTADOS_SERVICIO = [
  { value: "PLANIFICADO", label: "Planificado" },
  { value: "EN_CURSO", label: "En curso" },
  { value: "FINALIZADO", label: "Finalizado" },
  { value: "CANCELADO", label: "Cancelado" },
] as const;

export const ESTADO_SERVICIO_LABELS: Record<string, string> =
  Object.fromEntries(ESTADOS_SERVICIO.map(({ value, label }) => [value, label]));
