import { useMemo, useState } from "react";
import type { EstadoSesion, SesionListParams } from "@/features/sesiones/types";

export function useSesionesFiltros() {
  const [estado, setEstado] = useState<EstadoSesion | null>(null);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const params = useMemo<SesionListParams>(
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
    params,
    setEstado,
    setFechaDesde,
    setFechaHasta,
    clearFilters,
  };
}
