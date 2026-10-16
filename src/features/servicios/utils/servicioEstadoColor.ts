import { hexConAlpha } from "@/features/mapa/utils/estadoLoteColor";
import { ESTADO_SERVICIO_LABELS } from "../constants";
import type { EstadoServicio } from "../types";

// Mismo patrón que features/mapa/utils/estadoLoteColor.ts: un mapa fijo de
// estado -> color. Las badges simples (.servicio-badge--{ESTADO}) se quedan
// con sus clases CSS; este util es para donde hace falta un color resuelto
// en estilo inline (barras de la línea de tiempo, leyenda, selector de
// estado con conteos).
const COLOR_POR_ESTADO: Record<EstadoServicio, string> = {
  PLANIFICADO: "#3e5c76", // --azul-acero
  EN_CURSO: "#e0a83e", // --ambar-aviso
  FINALIZADO: "#4a9163", // --verde-confirmacion
  CERRADO: "#8a948c", // tono gris, más oscuro que --gris-niebla para texto/trazo
  CANCELADO: "#c94c4c", // --rojo-alerta
};

export function colorPorEstadoServicio(estado: EstadoServicio): string {
  return COLOR_POR_ESTADO[estado] ?? COLOR_POR_ESTADO.CANCELADO;
}

export function labelPorEstadoServicio(estado: EstadoServicio): string {
  return ESTADO_SERVICIO_LABELS[estado] ?? estado;
}

export { hexConAlpha };

/** Orden de la leyenda del timeline (CANCELADO nunca se muestra: un servicio
 * cancelado no aparece listado en ningún lado). */
export const ESTADOS_TIMELINE: EstadoServicio[] = [
  "PLANIFICADO",
  "EN_CURSO",
  "FINALIZADO",
  "CERRADO",
];
