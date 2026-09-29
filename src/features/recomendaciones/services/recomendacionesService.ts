import { getAccessToken } from "@/features/auth";
import { getJson, patchJson } from "@/services/httpClient";
import type {
  AptitudVaca,
  DecisionPayload,
  RecomendacionesServicio,
} from "../types";

export function getRecomendacionesSesion(
  sesionId: number,
): Promise<AptitudVaca[]> {
  const token = getAccessToken();
  return getJson<AptitudVaca[]>(
    `/sesiones-captura/${sesionId}/recomendaciones`,
    token,
  );
}

export function getRecomendacionesServicio(
  servicioId: number,
  dias: number,
): Promise<RecomendacionesServicio> {
  const token = getAccessToken();
  return getJson<RecomendacionesServicio>(
    `/servicios/${servicioId}/recomendaciones?dias=${dias}`,
    token,
  );
}

/** Acepta o rechaza varias recomendaciones pendientes (todo o nada). */
export function decidirRecomendaciones(payload: DecisionPayload): Promise<void> {
  const token = getAccessToken();
  return patchJson<void, DecisionPayload>("/recomendaciones/", payload, token);
}
