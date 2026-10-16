export type FaseServicio = "CABEZA" | "CUERPO" | "COLA";

export type ProgresoFaseServicio = {
  diaActual: number;
  totalDias: number;
  fase: FaseServicio;
  finCabeza: number; // último día (1-indexado) de la fase Cabeza
  finCuerpo: number; // último día de la fase Cuerpo (Cola va de acá a totalDias)
  fechaFinCabeza: string; // "YYYY-MM-DD", para el caption "cuentan como cabeza hasta el X"
  diasRestantes: number;
};

const FASE_LABELS: Record<FaseServicio, string> = {
  CABEZA: "Cabeza",
  CUERPO: "Cuerpo",
  COLA: "Cola",
};

export function labelFase(fase: FaseServicio): string {
  return FASE_LABELS[fase];
}

// Las fechas del backend son "YYYY-MM-DD" sin hora: se parsean como medianoche
// UTC para que la diferencia en días no dependa de la zona horaria del navegador.
function aFechaUtc(fecha: string): Date {
  const [year, month, day] = fecha.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function diferenciaDias(desde: Date, hasta: Date): number {
  const MS_POR_DIA = 1000 * 60 * 60 * 24;
  return Math.round((hasta.getTime() - desde.getTime()) / MS_POR_DIA);
}

function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getTime() + dias * 1000 * 60 * 60 * 24);
}

function aIso(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/**
 * Progreso del servicio dentro de su ventana de fechas, dividida en tercios
 * (Cabeza / Cuerpo / Cola). Pura aritmética de fechas reales — no hay campo
 * de "fase" en el backend, se calcula client-side a partir de
 * fecha_inicio/fecha_fin. Devuelve null si falta fecha_fin (solo posible en
 * datos muy viejos, de antes de que fuera obligatoria).
 */
export function calcularFaseServicio(
  fechaInicio: string,
  fechaFin: string | null,
  hoy: Date = new Date(),
): ProgresoFaseServicio | null {
  if (!fechaFin) return null;

  const inicio = aFechaUtc(fechaInicio);
  const fin = aFechaUtc(fechaFin);
  const totalDias = Math.max(1, diferenciaDias(inicio, fin));

  // Clampeado: cubre el caso de una lectura stale donde "hoy" ya pasó
  // fecha_fin pero el servicio todavía no transicionó a FINALIZADO.
  const hoyUtc = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
  const diaSinClamp = diferenciaDias(inicio, hoyUtc) + 1;
  const diaActual = Math.min(Math.max(diaSinClamp, 1), totalDias);

  const tercio = totalDias / 3;
  const finCabeza = Math.round(tercio);
  const finCuerpo = Math.round(2 * tercio);

  const fase: FaseServicio = diaActual <= finCabeza ? "CABEZA" : diaActual <= finCuerpo ? "CUERPO" : "COLA";

  return {
    diaActual,
    totalDias,
    fase,
    finCabeza,
    finCuerpo,
    fechaFinCabeza: aIso(sumarDias(inicio, finCabeza - 1)),
    diasRestantes: totalDias - diaActual,
  };
}
