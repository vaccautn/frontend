/** Filtro por fecha de alta en el sistema (creado_en del animal).
 *
 * Los rangos se calculan en la hora local del productor ("hoy" es el día de
 * Argentina, no el de UTC) y se mandan al backend como momentos ISO:
 * `alta_desde` incluido y `alta_hasta` excluido. */

import { formatFecha } from "./formatDate";

export type FiltroAlta =
  | { tipo: "hoy" | "7dias" | "30dias" | "anio" }
  | { tipo: "rango"; desde: string; hasta: string };

export const PRESETS_ALTA = [
  { tipo: "hoy", etiqueta: "Hoy" },
  { tipo: "7dias", etiqueta: "Últimos 7 días" },
  { tipo: "30dias", etiqueta: "Últimos 30 días" },
  { tipo: "anio", etiqueta: "Este año" },
] as const;

function inicioDelDia(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias);
}

/** "2026-10-31" → medianoche local de ese día. */
function fechaLocal(fecha: string): Date {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

export function rangoDeAlta(
  filtro: FiltroAlta | null,
  ahora: Date = new Date(),
): { alta_desde?: string; alta_hasta?: string } {
  if (!filtro) return {};
  const hoy = inicioDelDia(ahora);
  switch (filtro.tipo) {
    case "hoy":
      return { alta_desde: hoy.toISOString() };
    case "7dias":
      return { alta_desde: sumarDias(hoy, -6).toISOString() };
    case "30dias":
      return { alta_desde: sumarDias(hoy, -29).toISOString() };
    case "anio":
      return { alta_desde: new Date(hoy.getFullYear(), 0, 1).toISOString() };
    case "rango":
      return {
        ...(filtro.desde ? { alta_desde: fechaLocal(filtro.desde).toISOString() } : {}),
        // El día "hasta" se incluye entero: el límite es la medianoche siguiente.
        ...(filtro.hasta ? { alta_hasta: sumarDias(fechaLocal(filtro.hasta), 1).toISOString() } : {}),
      };
  }
}

export function etiquetaFiltroAlta(filtro: FiltroAlta | null): string {
  if (!filtro) return "Fecha de alta";
  if (filtro.tipo !== "rango") {
    return `Alta: ${PRESETS_ALTA.find((p) => p.tipo === filtro.tipo)!.etiqueta.toLowerCase()}`;
  }
  if (filtro.desde && filtro.hasta) {
    return filtro.desde === filtro.hasta
      ? `Alta: ${formatFecha(filtro.desde)}`
      : `Alta: ${formatFecha(filtro.desde)} – ${formatFecha(filtro.hasta)}`;
  }
  return filtro.desde ? `Alta desde ${formatFecha(filtro.desde)}` : `Alta hasta ${formatFecha(filtro.hasta)}`;
}
