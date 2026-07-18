import { getJson, postJson } from "@/services/httpClient";
import { getAccessToken } from "@/features/auth";
import type { SesionCaptura, SesionListParams } from "../types";

export function getSesionesConResumen(
  params: SesionListParams = {},
): Promise<SesionCaptura[]> {
  const token = getAccessToken();
  const query = new URLSearchParams();
  if (params.estado) query.set("estado", params.estado);
  if (params.fecha_inicio_desde)
    query.set("fecha_inicio_desde", params.fecha_inicio_desde);
  if (params.fecha_inicio_hasta)
    query.set("fecha_inicio_hasta", params.fecha_inicio_hasta);

  const qs = query.toString();
  return getJson<SesionCaptura[]>(
    `/sesiones-captura/con-resumen${qs ? `?${qs}` : ""}`,
    token,
  );
}

export function getSesionActiva(): Promise<SesionCaptura> {
  const token = getAccessToken();
  return getJson<SesionCaptura>("/sesiones-captura/activa", token);
}

export function crearSesion(): Promise<SesionCaptura> {
  const token = getAccessToken();
  return postJson<SesionCaptura, Record<string, never>>(
    "/sesiones-captura/",
    {},
    token,
  );
}

export function getSesion(id: number): Promise<SesionCaptura> {
  const token = getAccessToken();
  return getJson<SesionCaptura>(`/sesiones-captura/${id}`, token);
}
