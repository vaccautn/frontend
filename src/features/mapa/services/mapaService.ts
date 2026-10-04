import { deleteRequest, getJson, putJson } from "@/services/httpClient";
import { getAccessToken } from "@/features/auth";
import type {
  GuardarGeometriaPayload,
  LotePotreroFeature,
  LotesPotreroFeatureCollection,
  Movimiento,
} from "../types";

// FastAPI/Pydantic serializa los campos Decimal (superficie_ha, receptividad_ev_ha,
// carga_animales_ha) como strings en el JSON para no perder precisión — nunca llegan
// como number, aunque el resto de la app los use como tales. Se normalizan acá, en el
// límite con el backend, para que el resto del frontend pueda confiar en el tipo real.
function numeroONull(valor: unknown): number | null {
  if (valor === null || valor === undefined) return null;
  const numero = Number(valor);
  return Number.isNaN(numero) ? null : numero;
}

function normalizarFeature(feature: LotePotreroFeature): LotePotreroFeature {
  return {
    ...feature,
    properties: {
      ...feature.properties,
      superficie_ha: numeroONull(feature.properties.superficie_ha),
      receptividad_ev_ha: numeroONull(feature.properties.receptividad_ev_ha),
      carga_animales_ha: numeroONull(feature.properties.carga_animales_ha),
      edad_promedio_meses: numeroONull(feature.properties.edad_promedio_meses),
    },
  };
}

export async function getMapaLotes(): Promise<LotesPotreroFeatureCollection> {
  const token = getAccessToken();
  const data = await getJson<LotesPotreroFeatureCollection>("/lotes/mapa", token);
  return { ...data, features: data.features.map(normalizarFeature) };
}

export function getRecomendaciones(): Promise<Movimiento[]> {
  const token = getAccessToken();
  return getJson<Movimiento[]>("/lotes/mapa/recomendaciones", token);
}

export function guardarGeometriaLote(
  loteId: number,
  payload: GuardarGeometriaPayload,
): Promise<void> {
  const token = getAccessToken();
  return putJson<void, GuardarGeometriaPayload>(`/lotes/${loteId}/geometria`, payload, token);
}

export function eliminarGeometriaLote(loteId: number): Promise<void> {
  const token = getAccessToken();
  return deleteRequest(`/lotes/${loteId}/geometria`, token);
}
