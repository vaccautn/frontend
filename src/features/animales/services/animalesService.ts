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
  AnimalLoteGroup,
  AnimalListParams,
  EvaluacionCC,
  EvidenciaImagenRead,
  RegisterAnimalPayload,
  RegisterEvaluacionCCPayload,
  UpdateAnimalPayload,
  UpdateEvaluacionCCPayload,
} from "@/features/animales/types";
import { getSesionActiva } from "@/features/sesiones/services/sesionesService";

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
  return getJson<Animal>(`/animales/${id}/`, token);
}

type EvaluacionesFiltros = {
  animalId?: number;
  sesionId?: number;
};

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

export interface RegistrarEvaluacionCCParams {
  sesionId?: number;
  animalId: number;
  valorCc: number;
  escalaMin: number;
  escalaMax: number;
  observaciones: string;
  files?: File[];
}

export interface RegistrarEvaluacionCCResult {
  evaluacion: EvaluacionCC;
  imagenesConError: boolean;
}

export async function registrarEvaluacionCCCompleta(
  params: RegistrarEvaluacionCCParams,
): Promise<RegistrarEvaluacionCCResult> {
  const sesionIdFinal = params.sesionId ?? (await getSesionActiva()).id;

  const evaluacion = await registerEvaluacionCc({
    sesion_id: sesionIdFinal,
    animal_id: params.animalId,
    valor_cc: params.valorCc,
    escala_min: params.escalaMin,
    escala_max: params.escalaMax,
    observaciones: params.observaciones,
  });

  let imagenesConError = false;
  if (params.files && params.files.length > 0) {
    try {
      await subirImagenesEvaluacion(evaluacion.id, params.files);
    } catch {
      imagenesConError = true;
    }
  }

  return { evaluacion, imagenesConError };
}
