import type { TipoRecomendacion } from "./types";

/** Orden y nombres de las medidas. "Destete temporario" es el término del
 * cliente (el criterio de aceptación decía "temporal"). Coincide con el
 * orden alfabético con el que el backend devuelve las recomendaciones. */
export const MEDIDAS: { tipo: TipoRecomendacion; label: string }[] = [
  { tipo: "DESTETE_PRECOZ", label: "Destete precoz" },
  { tipo: "DESTETE_TEMPORARIO", label: "Destete temporario" },
  { tipo: "TRATAMIENTO_HORMONAL", label: "Tratamiento hormonal" },
];

export const TIPO_RECOMENDACION_LABELS: Record<TipoRecomendacion, string> =
  Object.fromEntries(MEDIDAS.map(({ tipo, label }) => [tipo, label])) as Record<
    TipoRecomendacion,
    string
  >;
