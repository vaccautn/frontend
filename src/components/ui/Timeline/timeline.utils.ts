import type { TimelinePeriod } from "./Timeline.types";

export const MESES_ABREVIADOS: readonly string[] = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

/** Ancho mínimo visible (%) de una barra, para que no desaparezca si queda recortada. */
const ANCHO_MINIMO_VISIBLE_PCT = 0.5;

export interface LimitesEscala {
  inicio: Date;
  fin: Date;
}

export interface ColumnaTiempo {
  key: number;
  mesLabel: string;
  anioLabel: string;
  esInicioAnio: boolean;
}

export interface PosicionPeriodo {
  left: number;
  width: number;
}

export function esFechaValida(fecha: Date): boolean {
  return !Number.isNaN(fecha.getTime());
}

function sumarMeses(fecha: Date, meses: number): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth() + meses, 1);
}

function diferenciaMeses(desde: Date, hasta: Date): number {
  return (hasta.getFullYear() - desde.getFullYear()) * 12 + (hasta.getMonth() - desde.getMonth());
}

/**
 * `endDate` se interpreta como inclusivo a nivel de día: un período que
 * empieza y termina el mismo día debe verse con el ancho de un día completo,
 * no de cero. Para eso se suma 1 día de calendario (dejando que `Date`
 * normalice overflow de mes/año) en vez de fijar la hora a 23:59:59.999,
 * porque las fechas de origen no tienen componente horario y sumar un día
 * calendario es inmune a diferencias de timezone. Nunca muta `endDate`.
 */
export function finEfectivo(endDate: Date): Date {
  return new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1);
}

/** Límites de la escala para un año calendario completo: siempre exactamente
 * 12 meses (de enero a diciembre), sin scroll — la paginación entre años la
 * maneja `Timeline` con su propio estado de año visible. */
export function limitesDelAnio(anio: number): LimitesEscala {
  return { inicio: new Date(anio, 0, 1), fin: new Date(anio + 1, 0, 1) };
}

/** Un período es visible en la página actual si se solapa con los límites de
 * la escala, aunque sea parcialmente (se recorta visualmente en los bordes).
 * Fechas inválidas o invertidas se consideran fuera de rango. */
export function periodoEnRango(period: TimelinePeriod, limites: LimitesEscala): boolean {
  if (!esFechaValida(period.startDate) || !esFechaValida(period.endDate)) return false;
  if (period.endDate.getTime() < period.startDate.getTime()) return false;
  return (
    period.startDate.getTime() < limites.fin.getTime() &&
    finEfectivo(period.endDate).getTime() > limites.inicio.getTime()
  );
}

/** Genera las columnas mes/año visibles dentro de los límites de escala. */
export function generarColumnasTiempo(limites: LimitesEscala): ColumnaTiempo[] {
  const meses = diferenciaMeses(limites.inicio, limites.fin);
  if (meses <= 0) return [];

  return Array.from({ length: meses }, (_, i) => {
    const mes = sumarMeses(limites.inicio, i);
    const esInicioAnio = mes.getMonth() === 0;
    return {
      key: i,
      mesLabel: MESES_ABREVIADOS[mes.getMonth()],
      anioLabel: esInicioAnio || i === 0 ? String(mes.getFullYear()) : "",
      esInicioAnio,
    };
  });
}

/** Posición porcentual (0-100, clamp) de una fecha dentro de la escala. */
export function posicionDeFecha(fecha: Date, limites: LimitesEscala): number {
  const total = limites.fin.getTime() - limites.inicio.getTime();
  if (total <= 0) return 0;
  const pct = ((fecha.getTime() - limites.inicio.getTime()) / total) * 100;
  return Math.min(100, Math.max(0, pct));
}

/**
 * Posición (left%) y ancho (width%) de un período dentro de la escala,
 * recortado visualmente a los límites visibles. Devuelve `null` si el
 * período tiene fechas inválidas o `endDate` anterior a `startDate`.
 */
export function calcularPosicionPeriodo(
  period: TimelinePeriod,
  limites: LimitesEscala,
): PosicionPeriodo | null {
  if (!esFechaValida(period.startDate) || !esFechaValida(period.endDate)) return null;
  if (period.endDate.getTime() < period.startDate.getTime()) return null;

  const left = posicionDeFecha(period.startDate, limites);
  const right = posicionDeFecha(finEfectivo(period.endDate), limites);
  const width = Math.max(ANCHO_MINIMO_VISIBLE_PCT, right - left);
  return { left, width };
}

/**
 * Posición (%) del indicador "hoy". Devuelve `null` si `today` es inválida
 * o cae fuera de los límites visibles (nunca se clampa a un extremo falso).
 */
export function calcularPosicionHoy(today: Date, limites: LimitesEscala): number | null {
  if (!esFechaValida(today)) return null;
  if (today.getTime() < limites.inicio.getTime() || today.getTime() > limites.fin.getTime()) {
    return null;
  }
  return posicionDeFecha(today, limites);
}
