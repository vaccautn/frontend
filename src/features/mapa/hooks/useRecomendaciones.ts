import { useCallback, useEffect, useState } from "react";
import { getRecomendaciones } from "../services/mapaService";
import type { Movimiento } from "../types";

export function useRecomendaciones() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refetch = useCallback(() => {
    setLoading(true);
    setError("");
    return getRecomendaciones()
      .then(setMovimientos)
      .catch(() => setError("No se pudieron calcular las recomendaciones."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { movimientos, loading, error, refetch };
}
