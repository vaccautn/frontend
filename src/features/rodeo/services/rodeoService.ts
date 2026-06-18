import { postJson, getJson, putJson } from "@/services/httpClient";
import { getAccessToken } from "@/features/auth";
import type { Animal, RegisterAnimalPayload } from "@/features/rodeo/types";

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

export function getAnimales(): Promise<Animal[]> {
  const token = getAccessToken();
  return getJson<Animal[]>("/animales/", token);
}

export function getAnimal(id: number): Promise<Animal> {
  const token = getAccessToken();
  return getJson<Animal>(`/animales/${id}/`, token);
}

export type UpdateAnimalPayload = RegisterAnimalPayload;

export function updateAnimal(
  id: number,
  payload: UpdateAnimalPayload,
): Promise<Animal> {
  const token = getAccessToken();
  return putJson<Animal, UpdateAnimalPayload>(
    `/animales/${id}`,
    payload,
    token,
  );
}
