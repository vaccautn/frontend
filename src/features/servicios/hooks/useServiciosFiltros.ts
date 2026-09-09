import { useMemo, useState } from "react";
import type { EstadoServicio, ServicioListParams } from "@/features/servicios/types";

export function useServiciosFiltros() {
  const [estado, setEstado] = useState<EstadoServicio | null>(null);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const params = useMemo<ServicioListParams>(
    () => ({
      ...(estado ? { estado } : {}),
      ...(fechaDesde ? { fecha_inicio_desde: fechaDesde } : {}),
      ...(fechaHasta ? { fecha_inicio_hasta: fechaHasta } : {}),
    }),
    [estado, fechaDesde, fechaHasta],
  );

  const clearFilters = () => {
    setEstado(null);
    setFechaDesde("");
    setFechaHasta("");
  };

  return {
    estado,
    fechaDesde,
    fechaHasta,
    setEstado,
    setFechaDesde,
    setFechaHasta,
    clearFilters,
    params,
  };
}
