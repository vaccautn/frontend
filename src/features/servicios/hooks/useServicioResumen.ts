import { useCallback, useEffect, useRef, useState } from "react";
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

type ServicioResumenState = {
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

export type ServicioResumen = ServicioResumenState & {
  /** Vuelve a pedir todo al backend (mismo `servicioId` actual). */
  refetch: () => void;
  /** Setters granulares: permiten que ServicioDetalleCompleto actualice esta
   * misma fuente de datos tras una mutación (editar, agregar/quitar lote,
   * cargar resultados, cambiar rol de toro), en vez de mantener copias
   * locales que podrían desincronizarse del header/resumen colapsado. */
  setServicio: (servicio: ServicioRead) => void;
  setLotes: (lotes: ServicioLotesAgrupados) => void;
  setParticipantes: (participantes: ParticipanteServicio[]) => void;
  setToros: (toros: ToroServicio[]) => void;
};

const VACIO: Omit<ServicioResumenState, "status"> = {
  servicio: null,
  lotes: null,
  participantes: [],
  toros: [],
  animalesPorLoteId: new Map(),
  cantidadVacas: 0,
  hayResultadosPendientes: false,
  errorMessage: "",
};

function calcularCantidadVacas(
  servicio: ServicioRead,
  lotes: ServicioLotesAgrupados,
  animalesPorLoteId: Map<number, Animal[]>,
  participantes: ParticipanteServicio[],
): number {
  return servicio.estado === "PLANIFICADO"
    ? lotes.vientres.reduce(
        (total, lote) =>
          total +
          (animalesPorLoteId.get(lote.id) ?? []).filter((a) => a.estado === "ACTIVO").length,
        0,
      )
    : participantes.length;
}

function calcularHayResultadosPendientes(participantes: ParticipanteServicio[]): boolean {
  return participantes.some(
    (p) => p.resultado.estado === "PENDIENTE" && p.reservicio_id === null,
  );
}

/** Versión reducida del fetching de ServicioDetailPage.tsx: solo lo que
 * necesita ServicioResumenEstado para el panel liviano de ServiciosPage.
 * También expone setters granulares y `refetch` para que el detalle
 * expandido (ServicioDetalleCompleto) actualice la misma fuente de datos
 * que usa el header/resumen colapsado, en vez de mantener su propia copia. */
export function useServicioResumen(servicioId: number | null): ServicioResumen {
  const [data, setData] = useState<ServicioResumenState>({ status: "idle", ...VACIO });
  const generacionRef = useRef(0);

  const cargar = useCallback(async (id: number | null) => {
    const generacion = ++generacionRef.current;

    if (id === null) {
      setData({ status: "idle", ...VACIO });
      return;
    }

    setData({ status: "loading", ...VACIO });

    try {
      const servicio = await getServicio(id);
      const [lotes, participantes, toros] = await Promise.all([
        getLotesServicio(id),
        getParticipantesServicio(id),
        getTorosServicio(id),
      ]);

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
        animalesPorLoteId = new Map(entradas);
      }

      // Si mientras esperábamos arrancó un pedido más nuevo (cambió el id,
      // o se llamó a refetch), descartamos este resultado desactualizado.
      if (generacionRef.current !== generacion) return;

      setData({
        status: "ready",
        servicio,
        lotes,
        participantes,
        toros,
        animalesPorLoteId,
        cantidadVacas: calcularCantidadVacas(servicio, lotes, animalesPorLoteId, participantes),
        hayResultadosPendientes: calcularHayResultadosPendientes(participantes),
        errorMessage: "",
      });
    } catch (error) {
      if (generacionRef.current !== generacion) return;
      setData({
        status: "error",
        ...VACIO,
        errorMessage:
          error instanceof ApiError
            ? error.detail
            : "No se pudo cargar el resumen del servicio.",
      });
    }
  }, []);

  useEffect(() => {
    void cargar(servicioId);
  }, [servicioId, cargar]);

  const refetch = useCallback(() => {
    void cargar(servicioId);
  }, [cargar, servicioId]);

  const setServicio = useCallback((servicio: ServicioRead) => {
    setData((prev) => {
      if (!prev.lotes) return { ...prev, servicio };
      return {
        ...prev,
        servicio,
        cantidadVacas: calcularCantidadVacas(
          servicio,
          prev.lotes,
          prev.animalesPorLoteId,
          prev.participantes,
        ),
      };
    });
  }, []);

  const setLotes = useCallback((lotes: ServicioLotesAgrupados) => {
    setData((prev) => {
      if (!prev.servicio) return { ...prev, lotes };
      return {
        ...prev,
        lotes,
        cantidadVacas: calcularCantidadVacas(
          prev.servicio,
          lotes,
          prev.animalesPorLoteId,
          prev.participantes,
        ),
      };
    });
  }, []);

  const setParticipantes = useCallback((participantes: ParticipanteServicio[]) => {
    setData((prev) => ({
      ...prev,
      participantes,
      cantidadVacas:
        prev.servicio && prev.lotes
          ? calcularCantidadVacas(prev.servicio, prev.lotes, prev.animalesPorLoteId, participantes)
          : prev.cantidadVacas,
      hayResultadosPendientes: calcularHayResultadosPendientes(participantes),
    }));
  }, []);

  const setToros = useCallback((toros: ToroServicio[]) => {
    setData((prev) => ({ ...prev, toros }));
  }, []);

  return { ...data, refetch, setServicio, setLotes, setParticipantes, setToros };
}
