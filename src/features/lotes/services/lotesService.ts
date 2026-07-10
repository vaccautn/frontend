import { getJson } from "@/services/httpClient";
import { getAccessToken } from "@/features/auth";
import type { LoteOption } from "../types";

export function getLotes(): Promise<LoteOption[]> {
  const token = getAccessToken();
  return getJson<LoteOption[]>("/lotes/", token);
}
