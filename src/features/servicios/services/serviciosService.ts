import { getAccessToken } from "@/features/auth";
import { getJson, postJson } from "@/services/httpClient";
import type {
  ServicioCreatePayload,
  ServicioListParams,
  ServicioLotesAgrupados,
  ServicioRead,
} from "../types";

export function crearServicio(
  payload: ServicioCreatePayload,
): Promise<ServicioRead> {
  const token = getAccessToken();
  return postJson<ServicioRead, ServicioCreatePayload>(
    "/servicios/",
    payload,
    token,
  );
}

export function getServicios(
  params: ServicioListParams = {},
): Promise<ServicioRead[]> {
  const token = getAccessToken();
  const searchParams = new URLSearchParams();
  if (params.estado) searchParams.set("estado", params.estado);
  if (params.fecha_inicio_desde) {
    searchParams.set("fecha_inicio_desde", params.fecha_inicio_desde);
  }
  if (params.fecha_inicio_hasta) {
    searchParams.set("fecha_inicio_hasta", params.fecha_inicio_hasta);
  }

  const qs = searchParams.toString();
  return getJson<ServicioRead[]>(`/servicios/${qs ? `?${qs}` : ""}`, token);
}

export function getServicio(id: number): Promise<ServicioRead> {
  const token = getAccessToken();
  return getJson<ServicioRead>(`/servicios/${id}`, token);
}

export function getLotesServicio(id: number): Promise<ServicioLotesAgrupados> {
  const token = getAccessToken();
  return getJson<ServicioLotesAgrupados>(`/servicios/${id}/lotes`, token);
}
