import { useEffect, useState } from "react";
import { getAnimales } from "@/features/animales/services/animalesService";
import type { Animal } from "@/features/animales/types";
import {
  getLotesServicio,
  getParticipantesServicio,
  getServicio,
  getTorosServicio,
} from "../services/serviciosService";
import type {
  ParticipanteServicio,
  ServicioLotesAgrupados,
  ServicioRead,
  ToroServicio,
} from "../types";
import { ApiError } from "@/services/httpClient";

type Status = "idle" | "loading" | "ready" | "error";

type ServicioResumen = {
  status: Status;
  servicio: ServicioRead | null;
  lotes: ServicioLotesAgrupados | null;
  participantes: ParticipanteServicio[];
  toros: ToroServicio[];
  animalesPorLoteId: Map<number, Animal[]>;
  cantidadVacas: number;
  hayResultadosPendientes: boolean;
  errorMessage: string;
};

const VACIO: Omit<ServicioResumen, "status"> = {
  servicio: null,
  lotes: null,
  participantes: [],
  toros: [],
  animalesPorLoteId: new Map(),
  cantidadVacas: 0,
  hayResultadosPendientes: false,
  errorMessage: "",
};

/** Versión reducida del fetching de ServicioDetailPage.tsx: solo lo que
 * necesita ServicioResumenEstado para el panel liviano de ServiciosPage. */
export function useServicioResumen(servicioId: number | null): ServicioResumen {
  const [data, setData] = useState<ServicioResumen>({ status: "idle", ...VACIO });

  useEffect(() => {
    if (servicioId === null) {
      setData({ status: "idle", ...VACIO });
      return;
    }

    let cancelled = false;
    setData({ status: "loading", ...VACIO });

    void (async () => {
      try {
        const servicio = await getServicio(servicioId);
        const [lotes, participantes, toros] = await Promise.all([
          getLotesServicio(servicioId),
          getParticipantesServicio(servicioId),
          getTorosServicio(servicioId),
        ]);
        if (cancelled) return;

        const lotesAConsultar = [
          ...(servicio.estado === "PLANIFICADO" ? lotes.vientres : []),
          ...lotes.toros,
        ];
        let animalesPorLoteId = new Map<number, Animal[]>();
        if (lotesAConsultar.length > 0) {
          const entradas = await Promise.all(
            lotesAConsultar.map((lote) =>
              getAnimales({ lote_id: lote.id }).then(
                (animales) => [lote.id, animales] as const,
              ),
            ),
          );
          if (cancelled) return;
          animalesPorLoteId = new Map(entradas);
        }

        const cantidadVacas =
          servicio.estado === "PLANIFICADO"
            ? lotes.vientres.reduce(
                (total, lote) =>
                  total +
                  (animalesPorLoteId.get(lote.id) ?? []).filter(
                    (animal) => animal.estado === "ACTIVO",
                  ).length,
                0,
              )
            : participantes.length;

        const hayResultadosPendientes = participantes.some(
          (p) => p.resultado.estado === "PENDIENTE" && p.reservicio_id === null,
        );

        setData({
          status: "ready",
          servicio,
          lotes,
          participantes,
          toros,
          animalesPorLoteId,
          cantidadVacas,
          hayResultadosPendientes,
          errorMessage: "",
        });
      } catch (error) {
        if (cancelled) return;
        setData({
          status: "error",
          ...VACIO,
          errorMessage:
            error instanceof ApiError
              ? error.detail
              : "No se pudo cargar el resumen del servicio.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [servicioId]);

  return data;
}
