import { getAccessToken } from "@/features/auth";
import { deleteRequest, getJson, patchJson, postJson } from "@/services/httpClient";
import type {
  CargaResultadosPayload,
  ParticipanteServicio,
  ReservicioCreatePayload,
  ResultadoServicioCreatePayload,
  ResultadoServicioListParams,
  ResultadoServicioRead,
  ResultadoServicioUpdatePayload,
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

export function actualizarResultadoServicio(
  id: number,
  payload: ResultadoServicioUpdatePayload,
): Promise<ResultadoServicioRead> {
  const token = getAccessToken();
  return patchJson<ResultadoServicioRead, ResultadoServicioUpdatePayload>(
    `/resultados-servicio/${id}`,
    payload,
    token,
  );
}

/** Crea un reservicio con vacas vacías del servicio `origenId`: servicio
 * vinculado, lote nuevo con esas vacas y lote asociado, en una sola operación. */
export function crearReservicio(
  origenId: number,
  payload: ReservicioCreatePayload,
): Promise<ServicioRead> {
  const token = getAccessToken();
  return postJson<ServicioRead, ReservicioCreatePayload>(
    `/servicios/${origenId}/reservicios`,
    payload,
    token,
  );
}

/** Guarda el diagnóstico de varias vacas en una sola operación (todo o nada).
 * Devuelve los participantes actualizados. */
export function cargarResultadosServicio(
  id: number,
  payload: CargaResultadosPayload,
): Promise<ParticipanteServicio[]> {
  const token = getAccessToken();
  return patchJson<ParticipanteServicio[], CargaResultadosPayload>(
    `/servicios/${id}/resultados`,
    payload,
    token,
  );
}

export function getParticipantesServicio(
  id: number,
): Promise<ParticipanteServicio[]> {
  const token = getAccessToken();
  return getJson<ParticipanteServicio[]>(
    `/servicios/${id}/participantes`,
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
  if (params.servicio_origen_id !== undefined) {
    searchParams.set("servicio_origen_id", params.servicio_origen_id.toString());
  }

  const qs = searchParams.toString();
  // Un servicio eliminado queda CANCELADO en el backend; para el usuario ya
  // no existe, así que no se lista en ningún lado.
  return getJson<ServicioRead[]>(`/servicios/${qs ? `?${qs}` : ""}`, token).then(
    (servicios) => servicios.filter((s) => s.estado !== "CANCELADO"),
  );
}

export function getServicio(id: number): Promise<ServicioRead> {
  const token = getAccessToken();
  return getJson<ServicioRead>(`/servicios/${id}`, token);
}

export function getLotesServicio(id: number): Promise<ServicioLotesAgrupados> {
  const token = getAccessToken();
  return getJson<ServicioLotesAgrupados>(`/servicios/${id}/lotes`, token);
}

/** El backend no borra el servicio: lo pasa a CANCELADO. Se permite desde
 * PLANIFICADO, EN_CURSO o FINALIZADO. */
export function eliminarServicio(id: number): Promise<void> {
  const token = getAccessToken();
  return deleteRequest(`/servicios/${id}`, token);
}
