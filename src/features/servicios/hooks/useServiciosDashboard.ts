import { useCallback, useEffect, useState } from "react";
import {
  getLotesServicio,
  getResultadosServicio,
  getServicios,
} from "@/features/servicios/services/serviciosService";
import { getAnimales } from "@/features/animales/services/animalesService";
import type {
  LoteEnServicio,
  ResultadoServicioRead,
  ServicioRead,
} from "@/features/servicios/types";

export type UseServiciosDashboardResult = {
  servicios: ServicioRead[];
  resultados: ResultadoServicioRead[];
  lotesEnServicio: LoteEnServicio[];
  animalCaravanaPorId: Map<number, string>;
  loading: boolean;
  error: string;
  refetch: () => void;
};

export function useServiciosDashboard(): UseServiciosDashboardResult {
  const [servicios, setServicios] = useState<ServicioRead[]>([]);
  const [resultados, setResultados] = useState<ResultadoServicioRead[]>([]);
  const [lotesEnServicio, setLotesEnServicio] = useState<LoteEnServicio[]>([]);
  const [animalCaravanaPorId, setAnimalCaravanaPorId] = useState<
    Map<number, string>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const runFetch = useCallback(() => {
    setLoading(true);
    setError("");

    Promise.all([getServicios(), getResultadosServicio(), getAnimales()])
      .then(async ([serviciosData, resultadosData, animalesData]) => {
        setServicios(serviciosData);
        setResultados(resultadosData);
        setAnimalCaravanaPorId(
          new Map(
            animalesData
              .filter((a) => a.caravana)
              .map((a) => [a.id, a.caravana as string]),
          ),
        );

        const enCurso = serviciosData.filter((s) => s.estado === "EN_CURSO");
        const gruposPorServicio = await Promise.all(
          enCurso.map((servicio) =>
            getLotesServicio(servicio.id).then((grupos) => ({
              servicio,
              grupos,
            })),
          ),
        );

        const lotes: LoteEnServicio[] = gruposPorServicio.flatMap(
          ({ servicio, grupos }) => [
            ...grupos.vientres.map((lote) => ({
              lote,
              servicio,
              rol: "vientre" as const,
            })),
            ...grupos.toros.map((lote) => ({
              lote,
              servicio,
              rol: "toro" as const,
            })),
          ],
        );
        setLotesEnServicio(lotes);
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
    lotesEnServicio,
    animalCaravanaPorId,
    loading,
    error,
    refetch: runFetch,
  };
}
