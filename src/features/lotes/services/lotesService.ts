import { getJson, postJson } from "@/services/httpClient";
import { getAccessToken } from "@/features/auth";
import type { LoteOption } from "../types";

export function getLotes(): Promise<LoteOption[]> {
  const token = getAccessToken();
  return getJson<LoteOption[]>("/lotes/", token);
}

export type LotePayload = {
  nombre: string;
  descripcion: string;
  usuario_administrador_id: number;
  activo: boolean;
};

export function createLote(payload: LotePayload): Promise<LoteOption> {
  const token = getAccessToken();
  return postJson<LoteOption, LotePayload>("/lotes/", payload, token);
}
