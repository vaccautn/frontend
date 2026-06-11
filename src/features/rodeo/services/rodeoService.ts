import { postJson } from "@/services/httpClient";
import { getAccessToken } from "@/features/auth";

export type RegisterAnimalPayload = {
  id_caravana: string;
  raza: string;
  sexo: string;
  fecha_nacimiento: string; // ISO 8601: 'YYYY-MM-DD'
};

export type RegisterAnimalResponse = {
  message: string;
  // falta completar con la respuesta del endpoint
};

export function registerAnimal(
  payload: RegisterAnimalPayload,
): Promise<RegisterAnimalResponse> {
  const token = getAccessToken();
  return postJson<RegisterAnimalResponse, RegisterAnimalPayload>(
    "/rodeo/animales", // Cuando este el endpoint verificar si es igual a este
    payload,
    token,
  );
}
