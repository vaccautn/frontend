import { postJson, getJson, patchJson } from "@/services/httpClient";
import { getAccessToken } from "@/features/auth";
import type {
  Animal,
  AnimalListParams,
  EvaluacionCC,
  RegisterAnimalPayload,
  RegisterEvaluacionCCPayload,
  UpdateAnimalPayload,
} from "@/features/animales/types";

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

  const queryString = searchParams.toString();
  const path = queryString ? `/animales/?${queryString}` : "/animales/";
  return getJson<Animal[]>(path, token);
}

export function getAnimal(id: number): Promise<Animal> {
  const token = getAccessToken();
  return getJson<Animal>(`/animales/${id}`, token);
}

export function getEvaluacionesCc(animalId: number): Promise<EvaluacionCC[]> {
  const token = getAccessToken();
  const searchParams = new URLSearchParams({ animal_id: animalId.toString() });

  return getJson<EvaluacionCC[]>(`/evaluaciones-cc/?${searchParams.toString()}`, token);
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
