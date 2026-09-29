export type NivelCC = "critico" | "atencion" | "normal";

// Tabla mes × calificación de condición corporal (1 a 5) -> nivel de alerta.
// La condición corporal esperada varía según la época del año (parición,
// época seca, etc.), así que la misma calificación puede ser normal en un
// mes y crítica en otro. Índice de fila = mes (1 a 12), columna = valor_cc.
const NIVEL_POR_MES: Record<number, Record<number, NivelCC>> = {
  1: { 1: "critico", 2: "atencion", 3: "normal", 4: "normal", 5: "normal" },
  2: { 1: "critico", 2: "critico", 3: "normal", 4: "normal", 5: "normal" },
  3: { 1: "critico", 2: "critico", 3: "atencion", 4: "normal", 5: "normal" },
  4: { 1: "critico", 2: "critico", 3: "critico", 4: "normal", 5: "normal" },
  5: { 1: "critico", 2: "critico", 3: "critico", 4: "normal", 5: "normal" },
  6: { 1: "critico", 2: "critico", 3: "critico", 4: "normal", 5: "normal" },
  7: { 1: "critico", 2: "critico", 3: "critico", 4: "normal", 5: "normal" },
  8: { 1: "critico", 2: "critico", 3: "atencion", 4: "normal", 5: "normal" },
  9: { 1: "critico", 2: "critico", 3: "atencion", 4: "normal", 5: "normal" },
  10: { 1: "critico", 2: "atencion", 3: "atencion", 4: "normal", 5: "normal" },
  11: { 1: "critico", 2: "atencion", 3: "normal", 4: "normal", 5: "normal" },
  12: { 1: "critico", 2: "atencion", 3: "normal", 4: "normal", 5: "normal" },
};

/**
 * Nivel de alerta de una calificación de condición corporal, según el mes en
 * que se evaluó (ver NIVEL_POR_MES). `fecha` es cualquier string que
 * arranque con "YYYY-MM" (date-only o datetime).
 */
export function nivelCC(valorCc: number, fecha: string): NivelCC {
  const mes = Number(fecha.slice(5, 7));
  return NIVEL_POR_MES[mes]?.[valorCc] ?? "normal";
}
