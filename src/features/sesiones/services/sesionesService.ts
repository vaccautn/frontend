import { getJson, patchJson, postJson } from "@/services/httpClient";
import { getAccessToken } from "@/features/auth";
import type {
  PaginatedSesionesResumenResponse,
  SesionCapturaRead,
  SesionCapturaUpdatePayload,
  SesionListParams,
} from "../types";

export function getSesionesConResumen(
  params: SesionListParams = {},
): Promise<PaginatedSesionesResumenResponse> {
  const token = getAccessToken();
  const query = new URLSearchParams();
  if (params.estado) query.set("estado", params.estado);
  if (params.fecha_inicio_desde)
    query.set("fecha_inicio_desde", params.fecha_inicio_desde);
  if (params.fecha_inicio_hasta)
    query.set("fecha_inicio_hasta", params.fecha_inicio_hasta);
  query.set("limit", String(params.limit ?? 20));
  query.set("offset", String(params.offset ?? 0));

  const qs = query.toString();
  return getJson<PaginatedSesionesResumenResponse>(
    `/sesiones-captura/${qs ? `?${qs}` : ""}`,
    token,
  );
}

export function getSesionActiva(): Promise<SesionCapturaRead> {
  const token = getAccessToken();
  return getJson<SesionCapturaRead>("/sesiones-captura/activa", token);
}

export function crearSesion(): Promise<SesionCapturaRead> {
  const token = getAccessToken();
  return postJson<SesionCapturaRead, Record<string, never>>(
    "/sesiones-captura/",
    {},
    token,
  );
}

export function getSesion(id: number): Promise<SesionCapturaRead> {
  const token = getAccessToken();
  return getJson<SesionCapturaRead>(`/sesiones-captura/${id}`, token);
}

export function actualizarSesion(
  sesionId: number,
  datos: SesionCapturaUpdatePayload,
): Promise<SesionCapturaRead> {
  const token = getAccessToken();
  return patchJson<SesionCapturaRead, SesionCapturaUpdatePayload>(
    `/sesiones-captura/${sesionId}`,
    datos,
    token,
  );
}
