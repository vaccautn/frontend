import { useCallback, useEffect, useState } from "react";
import { getAnimalDashboard } from "@/features/animales/services/animalesService";
import type { DashboardAnimalData } from "@/features/animales/types";

export type UseAnimalDashboardResult = {
  data: DashboardAnimalData | null;
  loading: boolean;
  error: string;
  refetch: () => void;
};

export function useAnimalDashboard(animalId: number): UseAnimalDashboardResult {
  const [data, setData] = useState<DashboardAnimalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const runFetch = useCallback(() => {
    setLoading(true);
    setError("");
    getAnimalDashboard(animalId)
      .then(setData)
      .catch(() => setError("No se pudieron cargar los datos del dashboard."))
      .finally(() => setLoading(false));
  }, [animalId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      runFetch();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [runFetch]);

  return { data, loading, error, refetch: runFetch };
}
