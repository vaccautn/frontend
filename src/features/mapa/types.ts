import type { CategoriaAnimal } from "@/features/animales/types";

export type EstadoLote = "ROJO" | "AMARILLO" | "VERDE" | "AZUL" | "SIN_DATOS";

export type LotePotreroPropiedades = {
  id: number;
  nombre: string;
  categoria: CategoriaAnimal;
  superficie_ha: number | null;
  receptividad_ev_ha: number | null;
  cantidad_animales: number;
  carga_animales_ha: number | null;
  cc_promedio: number | null;
  estado: EstadoLote;
  centroide: GeoJSON.Point | null;
};

export type LotePotreroFeature = {
  type: "Feature";
  geometry: GeoJSON.Polygon | null;
  properties: LotePotreroPropiedades;
};

export type LotesPotreroFeatureCollection = {
  type: "FeatureCollection";
  features: LotePotreroFeature[];
};

export type Movimiento = {
  origen_lote_id: number;
  origen_nombre: string;
  origen_centroide: GeoJSON.Point | null;
  destino_lote_id: number;
  destino_nombre: string;
  destino_centroide: GeoJSON.Point | null;
  cantidad_animales: number;
  motivo: string;
};

export type ConfiguracionCarga = {
  id: number;
  usuario_administrador_id: number;
  umbral_cc_critico: number;
  umbral_carga_sobrecarga_pct: number;
  umbral_carga_holgura_pct: number;
  creado_en: string;
  actualizado_en: string;
};

export type ConfiguracionCargaUpdatePayload = Partial<
  Pick<
    ConfiguracionCarga,
    "umbral_cc_critico" | "umbral_carga_sobrecarga_pct" | "umbral_carga_holgura_pct"
  >
>;

export type GuardarGeometriaPayload = {
  geom: GeoJSON.Polygon;
  receptividad_ev_ha?: number;
};

// Un GroundOverlay de KML (imagen georreferenciada por una caja lat/lon), como las que
// trae un KMZ exportado de Google Earth. `ol/format/KML` no las interpreta.
export type GroundOverlay = {
  href: string;
  north: number;
  south: number;
  east: number;
  west: number;
  rotation: number;
};

export type CapaKmz = {
  kml: string;
  groundOverlays: GroundOverlay[];
};
