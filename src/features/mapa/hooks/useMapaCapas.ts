import { useEffect, useRef, type RefObject } from "react";
import Map from "ol/Map";
import View from "ol/View";
import { defaults as defaultControls } from "ol/control";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import OlFeature from "ol/Feature";
import type { FeatureLike } from "ol/Feature";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Text from "ol/style/Text";
import { fromLonLat } from "ol/proj";
import { isEmpty } from "ol/extent";

import { colorPorEstadoLote, hexConAlpha } from "../utils/estadoLoteColor";
import type { LotePotreroFeature, LotePotreroPropiedades } from "../types";

export type TipoCapaBase = "satelite" | "calles";

export const PROYECCION_MAPA = "EPSG:3857";
export const PROYECCION_DATOS = "EPSG:4326";
export const geoJsonFormat = new GeoJSON();

export const ESRI_WORLD_IMAGERY_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
export const ESRI_ATTRIBUTIONS =
  "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community";

export function crearCapaBase(tipo: TipoCapaBase): TileLayer {
  return new TileLayer({
    source:
      tipo === "satelite"
        ? new XYZ({ url: ESRI_WORLD_IMAGERY_URL, attributions: ESRI_ATTRIBUTIONS, maxZoom: 19 })
        : new OSM(),
  });
}

export function estiloLote(
  feature: FeatureLike,
  loteSeleccionadoId: number | null,
  loteHoverId: number | null = null,
): Style {
  const propiedades = feature.get("propiedades") as LotePotreroPropiedades | undefined;
  const color = propiedades ? colorPorEstadoLote(propiedades.estado) : "#a0aec0";
  const seleccionado = propiedades !== undefined && propiedades.id === loteSeleccionadoId;
  const enHover = !seleccionado && propiedades !== undefined && propiedades.id === loteHoverId;
  return new Style({
    stroke: new Stroke({
      color: seleccionado || enHover ? "#ffffff" : color,
      width: seleccionado ? 4 : enHover ? 3 : 2,
    }),
    fill: new Fill({ color: hexConAlpha(color, enHover ? 0.4 : 0.28) }),
    text: new Text({
      text: propiedades?.nombre ?? "",
      font: "12px sans-serif",
      fill: new Fill({ color: "#1a202c" }),
      stroke: new Stroke({ color: "#ffffff", width: 3 }),
    }),
  });
}

type UseMapaCapasOpciones = {
  mapDivRef: RefObject<HTMLDivElement | null>;
  features: LotePotreroFeature[];
  /** Si es false, no se registra click para seleccionar lotes (minimapa de solo lectura). */
  interactivo?: boolean;
  onLoteClick?: (loteId: number) => void;
  loteSeleccionadoId?: number | null;
  loteHoverId?: number | null;
  tipoCapaBase?: TipoCapaBase;
  centro?: [number, number];
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  fitPadding?: [number, number, number, number];
};

type UseMapaCapasResultado = {
  mapRef: RefObject<Map | null>;
  lotesSourceRef: RefObject<VectorSource>;
  baseTileLayerRef: RefObject<TileLayer | null>;
};

/**
 * Inicializa un `ol.Map` con capa base (satélite/calles) + capa de lotes (con estilo por
 * estado y resaltado del lote seleccionado), y mantiene la capa de lotes sincronizada con
 * `features`. Compartido entre el mapa grande (`MapaLotes`, que además agrega sus propias
 * capas de KMZ/dibujo/recomendaciones sobre el `Map` devuelto) y el minimapa de solo lectura
 * del modo pantalla completa de Rodeo — evita duplicar la inicialización de OpenLayers.
 */
export function useMapaCapas({
  mapDivRef,
  features,
  interactivo = true,
  onLoteClick,
  loteSeleccionadoId = null,
  loteHoverId = null,
  tipoCapaBase = "satelite",
  centro = [-64, -34],
  zoom = 6,
  minZoom = 6,
  maxZoom = 19,
  fitPadding = [60, 60, 60, 60],
}: UseMapaCapasOpciones): UseMapaCapasResultado {
  const mapRef = useRef<Map | null>(null);
  const baseTileLayerRef = useRef<TileLayer | null>(null);
  const lotesSourceRef = useRef(new VectorSource());
  const huboAjusteInicialRef = useRef(false);
  const loteSeleccionadoIdRef = useRef(loteSeleccionadoId);
  const loteHoverIdRef = useRef(loteHoverId);
  const onLoteClickRef = useRef(onLoteClick);

  useEffect(() => {
    loteSeleccionadoIdRef.current = loteSeleccionadoId;
    lotesSourceRef.current.changed();
  }, [loteSeleccionadoId]);

  useEffect(() => {
    loteHoverIdRef.current = loteHoverId;
    lotesSourceRef.current.changed();
  }, [loteHoverId]);

  useEffect(() => {
    onLoteClickRef.current = onLoteClick;
  }, [onLoteClick]);

  // ── Inicialización del mapa (una sola vez) ──────────────────────────────────
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;

    const baseTileLayer = crearCapaBase(tipoCapaBase);
    baseTileLayerRef.current = baseTileLayer;

    const map = new Map({
      target: mapDivRef.current,
      controls: defaultControls({ zoom: false }),
      layers: [
        baseTileLayer,
        new VectorLayer({
          source: lotesSourceRef.current,
          style: (feature) =>
            estiloLote(feature, loteSeleccionadoIdRef.current, loteHoverIdRef.current),
        }),
      ],
      view: new View({ center: fromLonLat(centro), zoom, minZoom, maxZoom }),
    });

    if (interactivo) {
      map.on("click", (evento) => {
        const loteFeature = map.forEachFeatureAtPixel(
          evento.pixel,
          (f) => f as OlFeature,
          { layerFilter: (layer) => layer.getSource() === lotesSourceRef.current },
        );
        if (!loteFeature) return;
        const propiedades = loteFeature.get("propiedades") as LotePotreroPropiedades | undefined;
        if (propiedades) onLoteClickRef.current?.(propiedades.id);
      });
    }

    mapRef.current = map;
    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
      baseTileLayerRef.current = null;
      // Si este efecto se vuelve a montar (p.ej. doble-invocación de efectos en
      // StrictMode, que destruye y recrea el `Map`), hay que permitir que el fit
      // al extent se vuelva a aplicar sobre la instancia nueva — si no, el flag
      // queda en `true` por la instancia vieja (ya destruida) y la instancia que
      // realmente queda en pantalla nunca recibe el ajuste de zoom inicial.
      huboAjusteInicialRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se inicializa una sola vez
  }, []);

  // ── Redimensionar cuando el contenedor cambia de tamaño ─────────────────────
  useEffect(() => {
    if (!mapDivRef.current) return;
    const observer = new ResizeObserver(() => {
      mapRef.current?.updateSize();
    });
    observer.observe(mapDivRef.current);
    return () => observer.disconnect();
  }, [mapDivRef]);

  // ── Sincronizar los lotes-potrero (backend) con la capa vectorial ───────────
  useEffect(() => {
    lotesSourceRef.current.clear();
    const olFeatures = features
      .filter((f) => f.geometry)
      .map((f) => {
        const feature = geoJsonFormat.readFeature(
          { type: "Feature", geometry: f.geometry, properties: {} },
          { dataProjection: PROYECCION_DATOS, featureProjection: PROYECCION_MAPA },
        ) as OlFeature;
        feature.set("propiedades", f.properties);
        feature.setId(f.properties.id);
        return feature;
      });
    lotesSourceRef.current.addFeatures(olFeatures);

    if (!huboAjusteInicialRef.current && olFeatures.length > 0) {
      const extent = lotesSourceRef.current.getExtent();
      if (extent && !isEmpty(extent)) {
        // `updateSize()` antes del fit: el contenedor puede no tener todavía un tamaño
        // definitivo en el primer render (p.ej. dentro de un grid), y sin esto OL puede
        // calcular el zoom del fit contra un viewport de 0x0.
        mapRef.current?.updateSize();
        mapRef.current?.getView().fit(extent, { padding: fitPadding, maxZoom: 17 });
        huboAjusteInicialRef.current = true;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fitPadding es una constante
    // por call-site; incluirla recrearía el efecto en cada render (nueva identidad de array).
  }, [features]);

  return { mapRef, lotesSourceRef, baseTileLayerRef };
}
