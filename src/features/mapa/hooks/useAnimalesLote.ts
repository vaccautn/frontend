import { useEffect, useState } from "react";
import { getAnimalesLote } from "../services/mapaService";
import type { AnimalLoteDetalle } from "../types";

export function useAnimalesLote(loteId: number | null) {
  const [animales, setAnimales] = useState<AnimalLoteDetalle[]>([]);
  const [loading, setLoading] = useState(loteId !== null);

  const [scope, setScope] = useState(loteId);
  if (scope !== loteId) {
    setScope(loteId);
    setAnimales([]);
    setLoading(loteId !== null);
  }
  useEffect(() => {
    if (loteId === null) return;
    let active = true;
    getAnimalesLote(loteId)
      .then((data) => { if (active) setAnimales(data); })
      .catch(() => { if (active) setAnimales([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loteId]);

  return { animales, loading };
}
