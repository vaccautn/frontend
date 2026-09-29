import type { EstadoLote } from "../types";

// Mismo patrón que features/animales/utils/ccColor.ts: un mapa fijo de estado -> color.
const COLOR_POR_ESTADO: Record<EstadoLote, string> = {
  ROJO: "#e53e3e",
  AMARILLO: "#d69e2e",
  VERDE: "#38a169",
  AZUL: "#3182ce",
  SIN_DATOS: "#a0aec0",
};

const LABEL_POR_ESTADO: Record<EstadoLote, string> = {
  ROJO: "Aliviar",
  AMARILLO: "Al límite",
  VERDE: "Ok",
  AZUL: "Subutilizado",
  SIN_DATOS: "Sin datos",
};

export function colorPorEstadoLote(estado: EstadoLote): string {
  return COLOR_POR_ESTADO[estado] ?? COLOR_POR_ESTADO.SIN_DATOS;
}

export function labelPorEstadoLote(estado: EstadoLote): string {
  return LABEL_POR_ESTADO[estado] ?? estado;
}

export const ESTADOS_LEYENDA: EstadoLote[] = ["ROJO", "AMARILLO", "VERDE", "AZUL"];

export function hexConAlpha(hex: string, alpha: number): string {
  const valor = hex.replace("#", "");
  const r = parseInt(valor.substring(0, 2), 16);
  const g = parseInt(valor.substring(2, 4), 16);
  const b = parseInt(valor.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
