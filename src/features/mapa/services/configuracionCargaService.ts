import { getJson, putJson } from "@/services/httpClient";
import { getAccessToken } from "@/features/auth";
import type { ConfiguracionCarga, ConfiguracionCargaUpdatePayload } from "../types";

// Igual que en mapaService: los campos Decimal (umbral_*) llegan como string en el JSON.
function normalizar(configuracion: ConfiguracionCarga): ConfiguracionCarga {
  return {
    ...configuracion,
    umbral_cc_critico: Number(configuracion.umbral_cc_critico),
    umbral_carga_sobrecarga_pct: Number(configuracion.umbral_carga_sobrecarga_pct),
    umbral_carga_holgura_pct: Number(configuracion.umbral_carga_holgura_pct),
  };
}

export async function getConfiguracionCarga(): Promise<ConfiguracionCarga> {
  const token = getAccessToken();
  const data = await getJson<ConfiguracionCarga>("/configuracion-carga/", token);
  return normalizar(data);
}

export async function updateConfiguracionCarga(
  payload: ConfiguracionCargaUpdatePayload,
): Promise<ConfiguracionCarga> {
  const token = getAccessToken();
  const data = await putJson<ConfiguracionCarga, ConfiguracionCargaUpdatePayload>(
    "/configuracion-carga/",
    payload,
    token,
  );
  return normalizar(data);
}
