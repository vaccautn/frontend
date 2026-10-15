import { useCallback, useEffect, useState } from "react";
import {
  getResultadosServicio,
  getServicios,
} from "@/features/servicios/services/serviciosService";
import { getAnimales } from "@/features/animales/services/animalesService";
import type {
  ResultadoServicioRead,
  ServicioRead,
} from "@/features/servicios/types";

export type UseServiciosDashboardResult = {
  servicios: ServicioRead[];
  resultados: ResultadoServicioRead[];
  animalActivoIds: Set<number>;
  loading: boolean;
  error: string;
  refetch: () => void;
};

export function useServiciosDashboard(): UseServiciosDashboardResult {
  const [servicios, setServicios] = useState<ServicioRead[]>([]);
  const [resultados, setResultados] = useState<ResultadoServicioRead[]>([]);
  const [animalActivoIds, setAnimalActivoIds] = useState<Set<number>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const runFetch = useCallback(() => {
    setLoading(true);
    setError("");

    Promise.all([getServicios(), getResultadosServicio(), getAnimales()])
      .then(([serviciosData, resultadosData, animalesData]) => {
        const servicioIds = new Set(serviciosData.map((s) => s.id));
        setServicios(serviciosData);
        setResultados(
          resultadosData.filter((r) => servicioIds.has(r.servicio_id)),
        );
        setAnimalActivoIds(
          new Set(
            animalesData.filter((a) => a.estado === "ACTIVO").map((a) => a.id),
          ),
        );
      })
      .catch(() => setError("No se pudieron cargar los datos del dashboard."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      runFetch();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [runFetch]);

  return {
    servicios,
    resultados,
    animalActivoIds,
    loading,
    error,
    refetch: runFetch,
  };
}
