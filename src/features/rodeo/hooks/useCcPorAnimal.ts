import { useEffect, useState } from "react";
import { getAnimalesLote } from "@/features/mapa/services/mapaService";
import type { AnimalLoteDetalle } from "@/features/mapa/types";

/**
 * No existe un endpoint que traiga el CC de todos los animales a la vez, solo
 * `GET /lotes/{id}/animales` por lote. Pide en paralelo un pedido por cada lote
 * distinto representado (no por animal) y arma un mapa `animal_id -> CC`.
 */
export function useCcPorAnimal(loteIds: number[]) {
  const key = [...new Set(loteIds)].sort((a, b) => a - b).join(",");
  const [ccPorAnimal, setCcPorAnimal] = useState<Map<number, AnimalLoteDetalle>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ids = key ? key.split(",").map(Number) : [];
    if (ids.length === 0) {
      setCcPorAnimal(new Map());
      return;
    }
    let cancelado = false;
    setLoading(true);
    Promise.all(ids.map((id) => getAnimalesLote(id).catch(() => [] as AnimalLoteDetalle[])))
      .then((resultados) => {
        if (cancelado) return;
        const mapa = new Map<number, AnimalLoteDetalle>();
        resultados.flat().forEach((animal) => mapa.set(animal.id, animal));
        setCcPorAnimal(mapa);
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` ya representa el set de ids
  }, [key]);

  return { ccPorAnimal, loading };
}
