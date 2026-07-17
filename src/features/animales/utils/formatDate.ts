const DATE_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function parseFechaSolo(fecha: string): Date {
  const [year, month, day] = fecha.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Formatea una fecha sin hora (ej. "2026-06-05") como dd/mm/aaaa, evitando el
 * corrimiento de un día que produce `new Date(...)` al interpretar strings
 * date-only como UTC. */
export function formatFecha(fecha: string): string {
  return DATE_FORMATTER.format(parseFechaSolo(fecha));
}

/** Formatea un timestamp completo (ej. "2026-07-11T17:29:00Z") como
 * dd/mm/aaaa, hh:mm. */
export function formatFechaHora(fecha: string): string {
  return DATE_TIME_FORMATTER.format(new Date(fecha));
}
