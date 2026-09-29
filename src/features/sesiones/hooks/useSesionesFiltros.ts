import { useMemo, useState } from "react";
import type { SesionListParams } from "@/features/sesiones/types";

export function useSesionesFiltros() {
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

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
