import { useCallback, useEffect, useState } from "react";
import {
  getLotesServicio,
  getResultadosServicio,
  getServicios,
} from "@/features/servicios/services/serviciosService";
import { getAnimales } from "@/features/animales/services/animalesService";
import { estaActivoHoy } from "@/features/servicios/utils/servicioEstado";
import type { Animal } from "@/features/animales/types";
import type {
  LoteEnServicio,
  ResultadoServicioRead,
  ServicioRead,
} from "@/features/servicios/types";

export type UseServiciosDashboardResult = {
  servicios: ServicioRead[];
  resultados: ResultadoServicioRead[];
  lotesEnServicio: LoteEnServicio[];
  crias: Animal[];
  animalCaravanaPorId: Map<number, string>;
  loading: boolean;
  error: string;
  refetch: () => void;
};

export function useServiciosDashboard(): UseServiciosDashboardResult {
  const [servicios, setServicios] = useState<ServicioRead[]>([]);
  const [resultados, setResultados] = useState<ResultadoServicioRead[]>([]);
  const [lotesEnServicio, setLotesEnServicio] = useState<LoteEnServicio[]>([]);
  const [crias, setCrias] = useState<Animal[]>([]);
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
        setCrias(
          animalesData.filter(
            (a) => a.origen === "SERVICIO" && a.servicio_id !== null,
          ),
        );

        // El backend no transiciona PLANIFICADO -> EN_CURSO solo al llegar
        // la fecha de inicio: se usa el rango de fechas para decidir qué
        // servicios están efectivamente activos hoy (ver servicioEstado.ts).
        const activosHoy = serviciosData.filter(estaActivoHoy);
        const gruposPorServicio = await Promise.all(
          activosHoy.map((servicio) =>
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
    crias,
    animalCaravanaPorId,
    loading,
    error,
    refetch: runFetch,
  };
}
