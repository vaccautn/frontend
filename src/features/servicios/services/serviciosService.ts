import { getAccessToken } from "@/features/auth";
import { deleteRequest, getJson, patchJson, postJson } from "@/services/httpClient";
import type {
  ResultadoServicioCreatePayload,
  ResultadoServicioListParams,
  ResultadoServicioRead,
  ServicioCreatePayload,
  ServicioListParams,
  ServicioLoteAsociacion,
  ServicioLotesAgrupados,
  ServicioRead,
  ServicioUpdatePayload,
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

export function actualizarServicio(
  id: number,
  payload: ServicioUpdatePayload,
): Promise<ServicioRead> {
  const token = getAccessToken();
  return patchJson<ServicioRead, ServicioUpdatePayload>(
    `/servicios/${id}`,
    payload,
    token,
  );
}

export function crearResultadoServicio(
  payload: ResultadoServicioCreatePayload,
): Promise<ResultadoServicioRead> {
  const token = getAccessToken();
  return postJson<ResultadoServicioRead, ResultadoServicioCreatePayload>(
    "/resultados-servicio/",
    payload,
    token,
  );
}

export function getResultadosServicio(
  params: ResultadoServicioListParams = {},
): Promise<ResultadoServicioRead[]> {
  const token = getAccessToken();
  const searchParams = new URLSearchParams();
  if (params.servicioId !== undefined) {
    searchParams.set("servicio_id", params.servicioId.toString());
  }
  if (params.animalId !== undefined) {
    searchParams.set("animal_id", params.animalId.toString());
  }
  if (params.estado) searchParams.set("estado", params.estado);

  const qs = searchParams.toString();
  return getJson<ResultadoServicioRead[]>(
    `/resultados-servicio/${qs ? `?${qs}` : ""}`,
    token,
  );
}

export function asociarLoteServicio(
  servicioId: number,
  loteId: number,
): Promise<ServicioLoteAsociacion> {
  const token = getAccessToken();
  return postJson<ServicioLoteAsociacion, { lote_id: number }>(
    `/servicios/${servicioId}/lotes`,
    { lote_id: loteId },
    token,
  );
}

export function desasociarLoteServicio(
  servicioId: number,
  loteId: number,
): Promise<void> {
  const token = getAccessToken();
  return deleteRequest(`/servicios/${servicioId}/lotes/${loteId}`, token);
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
