import { useCallback, useEffect, useState } from "react";
import { getMapaLotes, getNdviHistorialLote } from "../services/mapaService";
import type { LotePotreroFeature } from "../types";

function withNdviValue(feature: LotePotreroFeature, ndvi: number | null): LotePotreroFeature {
  return {
   ...feature,
   properties: {
     ...feature.properties,
     ndvi_promedio: Number.isFinite(ndvi as number) ? Number(ndvi) : null,
   },
  };
}

async function enriquecerFeaturesConNdvi(features: LotePotreroFeature[]) {
  const resultados = await Promise.all(
   features.map(async (feature) => {
     try {
       const historial = await getNdviHistorialLote(feature.properties.id);
       const ultimo = historial.at(-1) ?? null;
       return withNdviValue(feature, ultimo?.ndvi_promedio ?? null);
     } catch {
       return withNdviValue(feature, feature.properties.ndvi_promedio ?? null);
     }
   }),
  );

  return resultados;
}

export function useMapaLotes() {
  const [features, setFeatures] = useState<LotePotreroFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refetch = useCallback(() => {
   setLoading(true);
   setError("");
   return getMapaLotes()
     .then(async (coleccion) => {
       const featuresConNdvi = await enriquecerFeaturesConNdvi(coleccion.features);
       setFeatures(featuresConNdvi);
     })
     .catch(() => setError("No se pudieron cargar los lotes del mapa."))
     .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
   refetch();
  }, [refetch]);

  return { features, loading, error, refetch };
}
