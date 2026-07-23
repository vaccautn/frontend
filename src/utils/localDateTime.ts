const EVENT_DATE_TIME_RE =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d{1,6})?)?(?:Z|[+-]\d{2}:\d{2})?$/;

const pad = (value: number) => String(value).padStart(2, "0");

export function localNaiveNow(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function eventDateTimeParts(value: string) {
  return EVENT_DATE_TIME_RE.exec(value);
}

export function formatEventDate(value: string): string {
  const parts = eventDateTimeParts(value);
  if (!parts) return value;

  const [, year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

export function formatEventDateTime(value: string): string {
  const parts = eventDateTimeParts(value);
  if (!parts) return value;

  const [, year, month, day, hours, minutes] = parts;
  return `${day}/${month}/${year}, ${hours}:${minutes}`;
}
