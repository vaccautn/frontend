import { useEffect, useState } from "react";
import { getAnimales } from "@/features/animales/services/animalesService";
import {
  getResultadosServicio,
  getServicios,
} from "@/features/servicios/services/serviciosService";

export type UseVacasPrenadasResult = {
  count: number;
  loading: boolean;
};

/**
 * Cuenta las vacas activas con un resultado PRENADA en algún servicio no
 * cancelado (una vaca preñada en dos servicios cuenta una vez). Con
 * `loteId`, solo las que hoy están en ese lote, igual que el resto del
 * dashboard.
 */
export function useVacasPrenadas(loteId: number | null): UseVacasPrenadasResult {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getResultadosServicio({ estado: "PRENADA" }),
      // getServicios ya descarta los cancelados.
      getServicios(),
      getAnimales({ estado: "ACTIVO", ...(loteId !== null ? { lote_id: loteId } : {}) }),
    ])
      .then(([resultados, servicios, animales]) => {
        if (cancelled) return;
        const servicioIds = new Set(servicios.map((s) => s.id));
        const animalIds = new Set(animales.map((a) => a.id));
        const prenadas = new Set(
          resultados
            .filter(
              (r) => servicioIds.has(r.servicio_id) && animalIds.has(r.animal_id),
            )
            .map((r) => r.animal_id),
        );
        setCount(prenadas.size);
      })
      .catch(() => {
        /* el indicador simplemente queda en 0 si falla */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loteId]);

  return { count, loading };
}
