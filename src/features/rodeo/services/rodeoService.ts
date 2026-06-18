import { postJson, getJson } from "@/services/httpClient";
import { getAccessToken } from "@/features/auth";

export type Animal = {
  id: number;
  caravana: string | null;
  sexo: string;
  raza: string;
  fecha_nacimiento: string | null;
  estado: string;
  observacion: string;
  lote_id: number | null;
  creado_en: string;
  actualizado_en: string;
};

export type RegisterAnimalPayload = {
  caravana: string;
  raza: string;
  sexo: string;
  fecha_nacimiento: string;
  lote_id: number | null;
};

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
