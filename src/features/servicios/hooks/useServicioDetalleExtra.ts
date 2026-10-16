import { useEffect, useRef, useState } from "react";
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
    status: "idle",
    ...VACIO,
  });
  const generacionRef = useRef(0);

  useEffect(() => {
    const generacion = ++generacionRef.current;

    if (servicioId === null) {
      setState({ status: "idle", ...VACIO });
      return;
    }

    setState({ status: "loading", ...VACIO });

    void (async () => {
      const [reservicios, origen, todosLosLotes] = await Promise.all([
        getServicios({ servicio_origen_id: servicioId }).catch(() => []),
        servicioOrigenId !== null
          ? getServicio(servicioOrigenId).catch(() => null)
          : Promise.resolve(null),
        getLotes().catch(() => []),
      ]);
      if (generacionRef.current !== generacion) return;
      setState({ status: "ready", reservicios, origen, todosLosLotes });
    })();
  }, [servicioId, servicioOrigenId]);

  return state;
}
