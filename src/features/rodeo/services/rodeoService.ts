import { postJson } from "@/services/httpClient";
import { getAccessToken } from "@/features/auth";

export type RegisterAnimalPayload = {
  caravana: string;
  raza: string;
  sexo: string;
  fecha_nacimiento: string;
  lote_id: number | null;
};

export type RegisterAnimalResponse = {
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

export function registerAnimal(
  payload: RegisterAnimalPayload,
): Promise<RegisterAnimalResponse> {
  const token = getAccessToken();
  return postJson<RegisterAnimalResponse, RegisterAnimalPayload>(
    "/animales/registrar-animal",
    payload,
    token,
  );
}
