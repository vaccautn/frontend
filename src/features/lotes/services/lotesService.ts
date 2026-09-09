import { deleteRequest, getJson, postJson, putJson } from "@/services/httpClient";
import { getAccessToken } from "@/features/auth";
import type { LoteOption } from "../types";

export function getLotes(): Promise<LoteOption[]> {
  const token = getAccessToken();
  return getJson<LoteOption[]>("/lotes/", token);
}

export type LotePayload = {
  nombre: string;
  descripcion: string;
  categoria: string;
  usuario_administrador_id: number;
  activo: boolean;
};

export function createLote(payload: LotePayload): Promise<LoteOption> {
  const token = getAccessToken();
  return postJson<LoteOption, LotePayload>("/lotes/", payload, token);
}

export type LoteUpdatePayload = {
  nombre?: string;
  descripcion?: string;
  categoria?: string;
  activo?: boolean;
};

export function updateLote(
  id: number,
  payload: LoteUpdatePayload,
): Promise<LoteOption> {
  const token = getAccessToken();
  return putJson<LoteOption, LoteUpdatePayload>(`/lotes/${id}`, payload, token);
}

export function eliminarLote(id: number): Promise<void> {
  const token = getAccessToken();
  return deleteRequest(`/lotes/${id}`, token);
}
