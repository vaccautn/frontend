import { useEffect, useState } from "react";
import { getResultadosServicio } from "@/features/servicios/services/serviciosService";

export type UseTernerosPendientesResult = {
  count: number;
  loading: boolean;
};

/**
 * Cuenta los resultados de servicio PARIDA que todavía no tienen `cria_id`
 * asociado: son terneros que nacieron (se registró el resultado) pero
 * todavía no fueron dados de alta como Animal con su propia caravana.
 */
export function useTernerosPendientes(): UseTernerosPendientesResult {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getResultadosServicio({ estado: "PARIDA" })
      .then((resultados) => {
        if (cancelled) return;
        setCount(resultados.filter((r) => r.cria_id === null).length);
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
  }, []);

  return { count, loading };
}
