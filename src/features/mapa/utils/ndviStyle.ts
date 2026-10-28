import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";

const ESTILO_NDVI = {
  rojo: "#e53e3e",
  naranja: "#dd6b20",
  verdeClaro: "#38a169",
  verdeOscuro: "#22543d",
  gris: "#808080",
} as const;

function hexToRgba(hex: string, alpha: number): string {
  const limpio = hex.replace("#", "");
  const normalizado =
    limpio.length === 3 ? limpio.split("").map((char) => char + char).join("") : limpio;

  const valor = Number.parseInt(normalizado, 16);
  const r = (valor >> 16) & 255;
  const g = (valor >> 8) & 255;
  const b = valor & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getLoteColorByNdvi(ndvi: number | null): string {
  if (ndvi === null || Number.isNaN(ndvi)) return ESTILO_NDVI.gris;
  if (ndvi < 0.3) return ESTILO_NDVI.rojo;
  if (ndvi < 0.55) return ESTILO_NDVI.naranja;
  if (ndvi < 0.7) return ESTILO_NDVI.verdeClaro;
  return ESTILO_NDVI.verdeOscuro;
}

export function getLoteStyle(ndvi: number | null, mapType: "satelite" | "calle"): Style {
  const fillOpacity = mapType === "satelite" ? 0.45 : 0.7;
  return new Style({
    stroke: new Stroke({ color: "#1a202c", width: 2 }),
    fill: new Fill({ color: hexToRgba(getLoteColorByNdvi(ndvi), fillOpacity) }),
  });
}
