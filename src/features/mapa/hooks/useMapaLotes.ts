import { useCallback, useEffect, useState } from "react";
import { getMapaLotes } from "../services/mapaService";
import type { LotePotreroFeature } from "../types";

export function useMapaLotes() {
  const [features, setFeatures] = useState<LotePotreroFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refetch = useCallback(() => {
    setLoading(true);
    setError("");
    return getMapaLotes()
      .then((coleccion) => setFeatures(coleccion.features))
      .catch(() => setError("No se pudieron cargar los lotes del mapa."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { features, loading, error, refetch };
}
