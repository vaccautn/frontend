import { getAccessToken } from "@/features/auth";
import {
  postJson,
  getJson,
  patchJson,
  putJson,
  postFormData,
  deleteRequest,
} from "@/services/httpClient";
import type {
  Animal,
  AnimalListParams,
  AnimalLoteGroup,
  DashboardAnimalesData,
  DashboardAnimalData,
  EvaluacionCC,
  EvidenciaImagenRead,
  RegisterAnimalPayload,
  RegisterEvaluacionCCPayload,
  UpdateAnimalPayload,
  UpdateEvaluacionCCPayload,
  UpdateEvaluacionCCSesionPayload,
  RegistrarEvaluacionCCParams,
  RegistrarEvaluacionCCResult,
} from "@/features/animales/types";
import { getSesionActiva } from "@/features/sesiones/services/sesionesService";
import { getImagenUploadErrorMessage } from "@/features/animales/utils/imagenUploadErrors";
import { localNaiveNow } from "@/utils/localDateTime";

export function registerAnimal(
  payload: RegisterAnimalPayload,
): Promise<Animal> {
  const token = getAccessToken();
  return postJson<Animal, RegisterAnimalPayload>(
    "/animales/registrar-animal",
    payload,
    token,
  );
}

export function getAnimales(params: AnimalListParams = {}): Promise<Animal[]> {
  const token = getAccessToken();
  const searchParams = buildAnimalSearchParams(params);

  const queryString = searchParams.toString();
  const path = queryString ? `/animales/?${queryString}` : "/animales/";
  return getJson<Animal[]>(path, token);
}

export function getAnimalesAgrupadosPorLote(
  params: AnimalListParams = {},
): Promise<AnimalLoteGroup[]> {
  const token = getAccessToken();
  const searchParams = buildAnimalSearchParams(params);

  const queryString = searchParams.toString();
  const path = queryString
    ? `/animales/agrupados-por-lote?${queryString}`
    : "/animales/agrupados-por-lote";
  return getJson<AnimalLoteGroup[]>(path, token);
}

function buildAnimalSearchParams(params: AnimalListParams): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (params.estado) {
    searchParams.set("estado", params.estado);
  }
  if (params.sexo) {
    searchParams.set("sexo", params.sexo);
  }
  if (params.raza) {
    searchParams.set("raza", params.raza);
  }
  if (params.caravana) {
    searchParams.set("caravana", params.caravana);
  }
  if (params.lote_id !== undefined) {
    searchParams.set("lote_id", params.lote_id.toString());
  }

  return searchParams;
}

export function getAnimal(id: number): Promise<Animal> {
  const token = getAccessToken();
  return getJson<Animal>(`/animales/${id}`, token);
}

type EvaluacionesFiltros = {
  animalId?: number;
  sesionId?: number;
};

export function getEvaluacionCc(id: number): Promise<EvaluacionCC> {
  const token = getAccessToken();
  return getJson<EvaluacionCC>(`/evaluaciones-cc/${id}`, token);
}

export function getEvaluacionesCc(
  filtros: EvaluacionesFiltros,
): Promise<EvaluacionCC[]> {
  const token = getAccessToken();
  const searchParams = new URLSearchParams();
  if (filtros.animalId !== undefined) {
    searchParams.set("animal_id", filtros.animalId.toString());
  }
  if (filtros.sesionId !== undefined) {
    searchParams.set("sesion_id", filtros.sesionId.toString());
  }

  return getJson<EvaluacionCC[]>(
    `/evaluaciones-cc/?${searchParams.toString()}`,
    token,
  );
}

export function updateAnimal(
  id: number,
  payload: UpdateAnimalPayload,
): Promise<Animal> {
  const token = getAccessToken();
  return patchJson<Animal, UpdateAnimalPayload>(
    `/animales/${id}`,
    payload,
    token,
  );
}

export function registerEvaluacionCc(
  payload: RegisterEvaluacionCCPayload,
): Promise<EvaluacionCC> {
  const token = getAccessToken();

  return postJson<EvaluacionCC, RegisterEvaluacionCCPayload>(
    "/evaluaciones-cc/",
    payload,
    token,
  );
}

export function updateEvaluacionCc(
  id: number,
  payload: UpdateEvaluacionCCPayload,
): Promise<EvaluacionCC> {
  const token = getAccessToken();

  return putJson<EvaluacionCC, UpdateEvaluacionCCPayload>(
    `/evaluaciones-cc/${id}`,
    payload,
    token,
  );
}

export function updateEvaluacionCcEnSesion(
  evaluacionId: number,
  sesionId: number,
  payload: UpdateEvaluacionCCSesionPayload,
): Promise<EvaluacionCC> {
  const token = getAccessToken();
  const query = new URLSearchParams({ sesion_id: sesionId.toString() });

  return putJson<EvaluacionCC, UpdateEvaluacionCCSesionPayload>(
    `/evaluaciones-cc/${evaluacionId}?${query.toString()}`,
    payload,
    token,
  );
}

export function anularEvaluacionCcEnSesion(
  evaluacionId: number,
  sesionId: number,
): Promise<void> {
  const token = getAccessToken();
  const query = new URLSearchParams({ sesion_id: sesionId.toString() });

  return deleteRequest(
    `/evaluaciones-cc/${evaluacionId}?${query.toString()}`,
    token,
  );
}

export function subirImagenesEvaluacion(
  evaluacionId: number,
  files: File[],
): Promise<EvidenciaImagenRead[]> {
  if (files.length === 0) return Promise.resolve([]);

  const token = getAccessToken();
  const formData = new FormData();
  files.forEach((file) => formData.append("imagenes", file));

  return postFormData<EvidenciaImagenRead[]>(
    `/evaluaciones-cc/${evaluacionId}/imagenes`,
    formData,
    token,
  );
}

export function getImagenesEvaluacion(
  evaluacionId: number,
): Promise<EvidenciaImagenRead[]> {
  const token = getAccessToken();
  return getJson<EvidenciaImagenRead[]>(
    `/evaluaciones-cc/${evaluacionId}/imagenes`,
    token,
  );
}

export function eliminarImagenEvaluacion(evidenciaId: number): Promise<void> {
  const token = getAccessToken();
  return deleteRequest(`/evidencias-visuales/${evidenciaId}`, token);
}

export function getAnimalesDashboard(
  loteId?: number | null,
): Promise<DashboardAnimalesData> {
  const token = getAccessToken();
  const path =
    loteId != null
      ? `/animales/dashboard?lote_id=${loteId}`
      : "/animales/dashboard";
  return getJson<DashboardAnimalesData>(path, token);
}

export function getAnimalDashboard(
  animalId: number,
): Promise<DashboardAnimalData> {
  const token = getAccessToken();
  return getJson<DashboardAnimalData>(`/animales/${animalId}/dashboard`, token);
}

/** La evaluación no se guardó porque su CC dependía de la foto y la IA la
 * rechazó (p. ej. no detectó un bovino). */
export class FotoRechazadaError extends Error {}

export async function registrarEvaluacionCCCompleta(
  params: RegistrarEvaluacionCCParams,
): Promise<RegistrarEvaluacionCCResult> {
  const fecha = params.fecha ?? localNaiveNow();
  const sesionIdFinal = params.sesionId ?? (await getSesionActiva(fecha)).id;

  const evaluacion = await registerEvaluacionCc({
    sesion_id: sesionIdFinal,
    animal_id: params.animalId,
    valor_cc: params.valorCc,
    escala_min: params.escalaMin,
    escala_max: params.escalaMax,
    observaciones: params.observaciones,
    fecha,
  });

  let evaluacionFinal = evaluacion;
  let imagenesError: string | undefined;
  if (params.files && params.files.length > 0) {
    try {
      await subirImagenesEvaluacion(evaluacion.id, params.files);
    } catch (error) {
      imagenesError = getImagenUploadErrorMessage(error, params.files.length);
    }

    // Sin CC manual, el valor con el que se creó es solo un provisorio. Si
    // ninguna foto quedó guardada, la IA no calculó nada: se anula la
    // evaluación para no dejar ese provisorio como si fuera una calificación.
    if (imagenesError && params.valorCcInferido) {
      const imagenes = await getImagenesEvaluacion(evaluacion.id).catch(() => []);
      if (imagenes.length === 0) {
        await anularEvaluacionCcEnSesion(evaluacion.id, sesionIdFinal).catch(
          () => {
            /* si falla la anulación, el error de la foto igual se informa */
          },
        );
        throw new FotoRechazadaError(
          `${imagenesError} No se guardó la evaluación: cargá la condición corporal a mano o probá con otra foto.`,
        );
      }
    }

    // La IA puede haber recalculado valor_cc aunque la subida termine en
    // error (una imagen del lote puede fallar después de que otra ya haya
    // sido inferida y committeada), así que siempre se refresca desde el
    // servidor en vez de confiar en el valor manual con el que se creó.
    try {
      evaluacionFinal = await getEvaluacionCc(evaluacion.id);
    } catch {
      // Sin conectividad para refrescar: se mantiene el valor con el que se
      // creó la evaluación; el usuario lo verá actualizado la próxima vez
      // que se recargue la lista.
    }
  }

  return { evaluacion: evaluacionFinal, imagenesError };
}
