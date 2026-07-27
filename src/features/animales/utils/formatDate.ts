import { formatEventDateTime } from "@/utils/localDateTime";

const DATE_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
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

/** Formatea fecha y hora de un evento sin reinterpretar su zona. */
export function formatFechaDeTimestamp(fecha: string): string {
  return formatEventDateTime(fecha);
}
