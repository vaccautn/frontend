import { getAccessToken, getStoredUser } from "../../auth/store/authSession.ts";
import { getJson, postFormData, postJson } from "../../../services/httpClient.ts";
import type {
  AnalisisVideo,
  AnalisisVideoList,
} from "../types/analisisVideo.ts";
import {
  crearCargaVideo,
  limpiarIntentoResueltoSiCoincide,
  obtenerIntentoPendiente,
} from "./analisisVideoUtils.ts";
export {
  analisisActivo,
  asociarClaveReintentoAnalisis,
  confirmarClaveReintentoAceptada,
  descartarClaveReintento,
  esMismoArchivoReintento,
  hayResultadosVideoAplicados,
  hayClaveReintento,
  iniciarPollingSecuencial,
  limpiarIntentoResueltoSiCoincide,
  obtenerClaveReintento,
  obtenerIntentoPendiente,
  puedeIniciarCarga,
  puedeResolverAnalisis,
  puedeReintentarAnalisis,
  validarArchivoVideo,
} from "./analisisVideoUtils.ts";

export function listarAnalisisVideo(sesionId: number): Promise<AnalisisVideoList> {
  return getJson<AnalisisVideoList>(
    `/sesiones-captura/${sesionId}/analisis-video`,
    getAccessToken(),
  );
}

export function subirAnalisisVideo(
  sesionId: number,
  file: File,
  idempotencyKey: string,
): Promise<AnalisisVideo> {
  const { body, headers } = crearCargaVideo(file, idempotencyKey);
  return postFormData<AnalisisVideo>(
    `/sesiones-captura/${sesionId}/analisis-video`,
    body,
    getAccessToken(),
    headers,
  );
}

export function reintentarAnalisisVideo(
  sesionId: number,
  analisisId: string,
): Promise<AnalisisVideo> {
  return postJson<AnalisisVideo, undefined>(
    `/sesiones-captura/${sesionId}/analisis-video/${analisisId}/retry`,
    undefined,
    getAccessToken(),
  );
}

export async function resolverAnalisisVideo(
  sesionId: number,
  analisisId: string,
): Promise<void> {
  const usuarioId = getStoredUser()?.id;
  const accessToken = getAccessToken();
  const intento =
    usuarioId === undefined
      ? null
      : obtenerIntentoPendiente(sesionId, usuarioId);
  await postJson<void, undefined>(
    `/sesiones-captura/${sesionId}/analisis-video/${analisisId}/resolve`,
    undefined,
    accessToken,
  );
  if (
    usuarioId !== undefined &&
    intento?.analysisId === analisisId
  ) {
    limpiarIntentoResueltoSiCoincide(
      sesionId,
      usuarioId,
      intento.key,
      analisisId,
    );
  }
}
