export const ESTADOS_SERVICIO = [
  { value: "PLANIFICADO", label: "Planificado" },
  { value: "EN_CURSO", label: "En curso" },
  { value: "FINALIZADO", label: "Finalizado" },
  { value: "CANCELADO", label: "Cancelado" },
] as const;

export const ESTADO_SERVICIO_LABELS: Record<string, string> =
  Object.fromEntries(ESTADOS_SERVICIO.map(({ value, label }) => [value, label]));

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
