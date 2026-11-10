import { usePageState } from "@/hooks/usePageState";
import { useMemo } from "react";
import type {
  EstadoServicio,
  ServicioListParams,
} from "@/features/servicios/types";

export function useServiciosFiltros() {
  const [estado, setEstado] = usePageState<EstadoServicio | null>(
    "servicios.estado",
    null,
  );
  const [fechaDesde, setFechaDesde] = usePageState("servicios.desde", "");
  const [fechaHasta, setFechaHasta] = usePageState("servicios.hasta", "");

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
