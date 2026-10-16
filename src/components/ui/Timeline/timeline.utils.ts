import type { TimelinePeriod } from "./Timeline.types";

export const MESES_ABREVIADOS: readonly string[] = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

/** Ancho mínimo (px) por mes visible, para que la escala no se comprima ilegible. */
export const ANCHO_MIN_POR_MES_PX = 64;

/** Ventana automática mínima: N meses antes y después de "hoy". */
export const MESES_MARGEN_MINIMO = 12;

/** Alto (px) de cada carril de barras. */
export const ALTO_LANE_PX = 36;

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

export interface PeriodoConLane {
  period: TimelinePeriod;
  lane: number;
}

export function esFechaValida(fecha: Date): boolean {
  return !Number.isNaN(fecha.getTime());
}

/**
 * Valida un rango inicio/fin: ambas fechas deben ser válidas y `fin` debe ser
 * estrictamente posterior a `inicio`. No aplica la regla de "fin inclusivo"
 * (eso es responsabilidad de `finEfectivo`): esta función solo descarta
 * rangos invertidos, degenerados o con fechas corruptas.
 */
export function normalizarRango(inicio: Date, fin: Date): LimitesEscala | null {
  if (!esFechaValida(inicio) || !esFechaValida(fin)) return null;
  if (fin.getTime() <= inicio.getTime()) return null;
  return { inicio, fin };
}

function inicioDeMes(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
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

/**
 * Calcula los límites de la escala temporal. Si `startDateProp`/`endDateProp`
 * forman un rango válido, se respetan tal cual (truncados a inicio de mes
 * para alinear la grilla). Si no, se calcula una ventana automática de
 * `MESES_MARGEN_MINIMO` meses antes/después de `today`, extendida para
 * contener todos los períodos válidos recibidos.
 */
export function calcularLimitesEscala(
  periods: TimelinePeriod[],
  today: Date,
  startDateProp?: Date,
  endDateProp?: Date,
): LimitesEscala {
  if (startDateProp && endDateProp) {
    const rango = normalizarRango(startDateProp, endDateProp);
    if (rango) {
      return { inicio: inicioDeMes(rango.inicio), fin: sumarMeses(inicioDeMes(rango.fin), 1) };
    }
  }

  const hoy = esFechaValida(today) ? today : new Date();
  const hoyMes = inicioDeMes(hoy);
  let inicio = sumarMeses(hoyMes, -MESES_MARGEN_MINIMO);
  let fin = sumarMeses(hoyMes, MESES_MARGEN_MINIMO);

  for (const period of periods) {
    if (!esFechaValida(period.startDate) || !esFechaValida(period.endDate)) continue;

    const inicioPeriodo = inicioDeMes(period.startDate);
    const finPeriodo = sumarMeses(inicioDeMes(finEfectivo(period.endDate)), 1);
    if (inicioPeriodo < inicio) inicio = inicioPeriodo;
    if (finPeriodo > fin) fin = finPeriodo;
  }

  return { inicio, fin };
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

/**
 * Distribuye períodos solapados en carriles: cada período se asigna al
 * primer carril cuyo último período ya haya terminado antes de que este
 * empiece (interval scheduling greedy, mínimo de carriles necesarios).
 * Períodos con fechas inválidas o invertidas se excluyen del resultado.
 */
export function asignarLanes(periods: TimelinePeriod[]): PeriodoConLane[] {
  const validos = periods.filter(
    (p) =>
      esFechaValida(p.startDate) &&
      esFechaValida(p.endDate) &&
      p.endDate.getTime() >= p.startDate.getTime(),
  );

  const ordenados = [...validos].sort((a, b) => {
    const porInicio = a.startDate.getTime() - b.startDate.getTime();
    if (porInicio !== 0) return porInicio;
    return a.endDate.getTime() - b.endDate.getTime();
  });

  const finDeCadaLane: number[] = [];
  const resultado: PeriodoConLane[] = [];

  for (const period of ordenados) {
    const inicio = period.startDate.getTime();
    const fin = finEfectivo(period.endDate).getTime();

    let lane = finDeCadaLane.findIndex((finLane) => finLane <= inicio);
    if (lane === -1) {
      lane = finDeCadaLane.length;
      finDeCadaLane.push(fin);
    } else {
      finDeCadaLane[lane] = fin;
    }

    resultado.push({ period, lane });
  }

  return resultado;
}

export function contarLanes(periodosConLane: PeriodoConLane[]): number {
  if (periodosConLane.length === 0) return 0;
  return Math.max(...periodosConLane.map((p) => p.lane)) + 1;
}

/** Ancho total (px) del área de escala, usado como referencia única de scroll. */
export function calcularAnchoTotalPx(
  limites: LimitesEscala,
  anchoMinPorMesPx: number = ANCHO_MIN_POR_MES_PX,
): number {
  const meses = diferenciaMeses(limites.inicio, limites.fin);
  return Math.max(0, meses) * anchoMinPorMesPx;
}
