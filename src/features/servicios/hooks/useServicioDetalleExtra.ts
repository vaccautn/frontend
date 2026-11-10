import { useEffect, useState } from "react";
import { getLotes } from "@/features/lotes/services/lotesService";
import type { LoteOption } from "@/features/lotes/types";
import { getServicio, getServicios } from "../services/serviciosService";
import type { ServicioRead } from "../types";

type Status = "idle" | "loading" | "ready";

type ServicioDetalleExtra = {
  status: Status;
  /** Reservicios hijos de este servicio (si tiene). */
  reservicios: ServicioRead[];
  /** Servicio del que este salió, si este mismo es un reservicio. */
  origen: ServicioRead | null;
  /** Todos los lotes del productor, para el selector de "agregar lote". */
  todosLosLotes: LoteOption[];
};

const VACIO: Omit<ServicioDetalleExtra, "status"> = {
  reservicios: [],
  origen: null,
  todosLosLotes: [],
};

/** Datos que solo hacen falta cuando el panel de servicio está expandido
 * (ver ServicioDetalleCompleto): reservicios hijos, servicio origen y el
 * listado completo de lotes. Son complementarios, no esenciales — una falla
 * puntual en cualquiera de los tres degrada a lista vacía en vez de tirar
 * abajo todo el panel expandido. */
export function useServicioDetalleExtra(
  servicioId: number | null,
  servicioOrigenId: number | null,
): ServicioDetalleExtra {
  const [state, setState] = useState<Omit<ServicioDetalleExtra, never>>({
    status: servicioId === null ? "idle" : "loading",
    ...VACIO,
  });

  const [scope, setScope] = useState({ servicioId, servicioOrigenId });
  if (scope.servicioId !== servicioId || scope.servicioOrigenId !== servicioOrigenId) {
    setScope({ servicioId, servicioOrigenId });
    setState({ status: servicioId === null ? "idle" : "loading", ...VACIO });
  }
  useEffect(() => {
    let active = true;

    if (servicioId === null) return;

    void (async () => {
      const [reservicios, origen, todosLosLotes] = await Promise.all([
        getServicios({ servicio_origen_id: servicioId }).catch(() => []),
        servicioOrigenId !== null
          ? getServicio(servicioOrigenId).catch(() => null)
          : Promise.resolve(null),
        getLotes().catch(() => []),
      ]);
      if (!active) return;
      setState({ status: "ready", reservicios, origen, todosLosLotes });
    })();
    return () => { active = false; };
  }, [servicioId, servicioOrigenId]);

  return state;
}
