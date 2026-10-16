import type { CategoriaAnimal } from "@/features/animales/types";

export type EstadoLote = "ROJO" | "AMARILLO" | "VERDE" | "SIN_DATOS";

export type LotePotreroPropiedades = {
  id: number;
  nombre: string;
  categoria: CategoriaAnimal;
  superficie_ha: number | null;
  cantidad_animales: number;
  carga_animales_ha: number | null;
  cc_promedio: number | null;
  edad_promedio_meses?: number | null;
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

export type AnimalLoteDetalle = {
  id: number;
  caravana: string | null;
  categoria: CategoriaAnimal;
  valor_cc: number | null;
  escala_min: number;
  escala_max: number;
  fecha_cc: string | null;
};

export type Movimiento = {
  origen_lote_id: number;
  origen_nombre: string;
  origen_centroide: GeoJSON.Point | null;
  destino_lote_id: number;
  destino_nombre: string;
  destino_centroide: GeoJSON.Point | null;
  motivo: string;
};

export type GuardarGeometriaPayload = {
  geom: GeoJSON.Polygon;
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
