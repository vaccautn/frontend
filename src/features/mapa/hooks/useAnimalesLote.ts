import { useEffect, useState } from "react";
import { getAnimalesLote } from "../services/mapaService";
import type { AnimalLoteDetalle } from "../types";

export function useAnimalesLote(loteId: number | null) {
  const [animales, setAnimales] = useState<AnimalLoteDetalle[]>([]);
  const [loading, setLoading] = useState(loteId !== null);

  useEffect(() => {
    if (loteId === null) {
      setAnimales([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getAnimalesLote(loteId)
      .then(setAnimales)
      .catch(() => setAnimales([]))
      .finally(() => setLoading(false));
  }, [loteId]);

  return { animales, loading };
}
