import { useCallback, useEffect, useState } from "react";
import { getSesionDashboard } from "@/features/sesiones/services/sesionesService";
import type { DashboardSesionData } from "@/features/sesiones/types";

export type UseSesionDashboardResult = {
  data: DashboardSesionData | null;
  loading: boolean;
  error: string;
  refetch: () => void;
};

export function useSesionDashboard(
  sesionId: number,
): UseSesionDashboardResult {
  const [data, setData] = useState<DashboardSesionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const runFetch = useCallback(() => {
    setLoading(true);
    setError("");
    getSesionDashboard(sesionId)
      .then(setData)
      .catch(() =>
        setError("No se pudieron cargar los datos del dashboard de sesión."),
      )
      .finally(() => setLoading(false));
  }, [sesionId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      runFetch();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [runFetch]);

  return { data, loading, error, refetch: runFetch };
}
