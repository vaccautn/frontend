import { useCallback, useEffect, useState } from "react";
import { getAnimalesDashboard } from "@/features/animales/services/animalesService";
import type { DashboardAnimalesData } from "@/features/animales/types";

export type UseAnimalesDashboardResult = {
  data: DashboardAnimalesData | null;
  loading: boolean;
  error: string;
  refetch: () => void;
};

export function useAnimalesDashboard(
  loteId: number | null,
): UseAnimalesDashboardResult {
  const [data, setData] = useState<DashboardAnimalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const runFetch = useCallback(() => {
    setLoading(true);
    setError("");
    getAnimalesDashboard(loteId)
      .then(setData)
      .catch(() =>
        setError("No se pudieron cargar los datos del dashboard."),
      )
      .finally(() => setLoading(false));
  }, [loteId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      runFetch();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [runFetch]);

  return { data, loading, error, refetch: runFetch };
}
