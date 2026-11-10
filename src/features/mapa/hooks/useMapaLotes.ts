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
    let active = true;
    getMapaLotes()
      .then((data) => { if (active) setFeatures(data.features); })
      .catch(() => { if (active) setError("No se pudieron cargar los lotes del mapa."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return { features, loading, error, refetch };
}
