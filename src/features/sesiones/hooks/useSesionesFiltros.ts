import { usePageState } from "@/hooks/usePageState";
import { useMemo } from "react";
import type { SesionListParams } from "@/features/sesiones/types";

export function useSesionesFiltros() {
  const [fechaDesde, setFechaDesde] = usePageState("sesiones.desde", "");
  const [fechaHasta, setFechaHasta] = usePageState("sesiones.hasta", "");

  const params = useMemo<SesionListParams>(
    () => ({
      ...(fechaDesde ? { fecha_inicio_desde: fechaDesde } : {}),
      ...(fechaHasta ? { fecha_inicio_hasta: fechaHasta } : {}),
    }),
    [fechaDesde, fechaHasta],
  );

  const clearFilters = () => {
    setFechaDesde("");
    setFechaHasta("");
  };

  return {
    fechaDesde,
    fechaHasta,
    params,
    setFechaDesde,
    setFechaHasta,
    clearFilters,
  };
}
