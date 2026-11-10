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

/** Un momento con zona (p. ej. creado_en, que el backend manda en UTC) como
 * fecha local, sin la hora: "31/10/2026". Se convierte a la zona local antes de
 * cortar la hora, así un alta de las 23 h de Argentina no aparece al día siguiente. */
export function formatMomento(momento: string): string {
  return DATE_FORMATTER.format(new Date(momento));
}

/** Formatea fecha y hora de un evento sin reinterpretar su zona. */
export function formatFechaDeTimestamp(fecha: string): string {
  return formatEventDateTime(fecha);
}
