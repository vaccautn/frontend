import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@chakra-ui/react";
import { IconMap, IconSatellite } from "@tabler/icons-react";
import { toast } from "react-toastify";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import ImageLayer from "ol/layer/Image";
import ImageStatic from "ol/source/ImageStatic";
import KML from "ol/format/KML";
import GeoJSON from "ol/format/GeoJSON";
import Draw from "ol/interaction/Draw";
import Modify from "ol/interaction/Modify";
import Snap from "ol/interaction/Snap";
import OlFeature from "ol/Feature";
import type { FeatureLike } from "ol/Feature";
import LineString from "ol/geom/LineString";
import Point from "ol/geom/Point";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import RegularShape from "ol/style/RegularShape";
import Text from "ol/style/Text";
import { fromLonLat } from "ol/proj";
import { isEmpty, type Extent } from "ol/extent";

import { ApiError } from "@/services/httpClient";
import { normalizeBackendDetail } from "@/features/auth";
import { getLotes } from "@/features/lotes/services/lotesService";
import type { LoteOption } from "@/features/lotes/types";

import { useMapaLotes } from "../hooks/useMapaLotes";
import { useRecomendaciones } from "../hooks/useRecomendaciones";
import { guardarGeometriaLote, eliminarGeometriaLote } from "../services/mapaService";
import { colorPorEstadoLote, hexConAlpha } from "../utils/estadoLoteColor";
import type { CapaKmz, LotePotreroPropiedades } from "../types";

import { KmzUploader } from "./KmzUploader";
import { DibujoToolbar } from "./DibujoToolbar";
import { LeyendaCarga } from "./LeyendaCarga";
import { LoteDetallePanel } from "./LoteDetallePanel";
import { RecomendacionesPanel } from "./RecomendacionesPanel";
import { GuardarPoligonoDialog } from "./GuardarPoligonoDialog";
import "./MapaLotes.css";

const PROYECCION_MAPA = "EPSG:3857";
const PROYECCION_DATOS = "EPSG:4326";
const geoJsonFormat = new GeoJSON();

const ESRI_WORLD_IMAGERY_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ESRI_ATTRIBUTIONS =
  "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community";

type Modo = "ver" | "dibujar" | "editar";
type TipoCapaBase = "satelite" | "calles";

function estiloLote(feature: FeatureLike): Style {
  const propiedades = feature.get("propiedades") as LotePotreroPropiedades | undefined;
  const color = propiedades ? colorPorEstadoLote(propiedades.estado) : "#a0aec0";
  return new Style({
    stroke: new Stroke({ color, width: 2 }),
    fill: new Fill({ color: hexConAlpha(color, 0.28) }),
    text: new Text({
      text: propiedades?.nombre ?? "",
      font: "12px sans-serif",
      fill: new Fill({ color: "#1a202c" }),
      stroke: new Stroke({ color: "#ffffff", width: 3 }),
    }),
  });
}

function estiloReferenciaKmz(): Style {
  return new Style({
    stroke: new Stroke({ color: "#f7fafc", width: 2, lineDash: [5, 5] }),
    fill: new Fill({ color: "rgba(255, 255, 255, 0.12)" }),
  });
}

function estiloDibujoEnCurso(): Style {
  return new Style({
    stroke: new Stroke({ color: "#3182ce", width: 2 }),
    fill: new Fill({ color: "rgba(49, 130, 206, 0.2)" }),
  });
}

function estiloMovimiento(feature: FeatureLike): Style[] {
  const geometry = feature.getGeometry();
  if (!(geometry instanceof LineString)) return [];
  const [[x1, y1], [x2, y2]] = geometry.getCoordinates();
  const angulo = Math.atan2(y2 - y1, x2 - x1);
  const cantidad = feature.get("cantidad");

  return [
    new Style({ stroke: new Stroke({ color: "#2d3748", width: 2, lineDash: [6, 4] }) }),
    new Style({
      geometry: new Point([x2, y2]),
      image: new RegularShape({
        points: 3,
        radius: 8,
        rotation: Math.PI / 2 - angulo,
        fill: new Fill({ color: "#2d3748" }),
      }),
    }),
    new Style({
      geometry: new Point([(x1 + x2) / 2, (y1 + y2) / 2]),
      text: new Text({
        text: `${cantidad}`,
        font: "bold 12px sans-serif",
        fill: new Fill({ color: "#ffffff" }),
        backgroundFill: new Fill({ color: "#2d3748" }),
        padding: [2, 4, 2, 4],
      }),
    }),
  ];
}

export function MapaLotes() {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const baseTileLayerRef = useRef<TileLayer | null>(null);
  const lotesSourceRef = useRef(new VectorSource());
  const kmzSourceRef = useRef(new VectorSource());
  const drawSourceRef = useRef(new VectorSource());
  const recomendacionesSourceRef = useRef(new VectorSource());
  const overlayLayersRef = useRef<ImageLayer<ImageStatic>[]>([]);
  const drawInteractionRef = useRef<Draw | null>(null);
  const modifyInteractionRef = useRef<Modify | null>(null);
  const snapInteractionsRef = useRef<Snap[]>([]);
  const huboAjusteInicialRef = useRef(false);

  const { features, refetch: refetchLotes } = useMapaLotes();
  const {
    movimientos,
    loading: cargandoRecomendaciones,
    refetch: refetchRecomendaciones,
  } = useRecomendaciones();

  const [tipoCapaBase, setTipoCapaBase] = useState<TipoCapaBase>("satelite");
  const [modo, setModo] = useState<Modo>("ver");
  const [todosLosLotes, setTodosLosLotes] = useState<LoteOption[]>([]);
  const [loteParaDibujo, setLoteParaDibujo] = useState<number | "">("");
  const [poligonoPendiente, setPoligonoPendiente] = useState<GeoJSON.Polygon | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [loteSeleccionado, setLoteSeleccionado] = useState<LotePotreroPropiedades | null>(null);
  const [mostrarRecomendaciones, setMostrarRecomendaciones] = useState(true);

  const lotesSinPoligono = useMemo(() => {
    const idsConPoligono = new Set(features.map((f) => f.properties.id));
    return todosLosLotes.filter((lote) => !idsConPoligono.has(lote.id));
  }, [todosLosLotes, features]);

  useEffect(() => {
    getLotes()
      .then(setTodosLosLotes)
      .catch(() => toast.error("No se pudieron cargar los lotes existentes."));
  }, [features]);

  // ── Inicialización del mapa (una sola vez) ──────────────────────────────────
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;

    const baseTileLayer = new TileLayer({
      source: new XYZ({
        url: ESRI_WORLD_IMAGERY_URL,
        attributions: ESRI_ATTRIBUTIONS,
        maxZoom: 19,
      }),
    });
    baseTileLayerRef.current = baseTileLayer;

    const map = new Map({
      target: mapDivRef.current,
      layers: [
        baseTileLayer,
        new VectorLayer({ source: kmzSourceRef.current, style: estiloReferenciaKmz }),
        new VectorLayer({ source: lotesSourceRef.current, style: estiloLote }),
        new VectorLayer({ source: drawSourceRef.current, style: estiloDibujoEnCurso }),
        new VectorLayer({ source: recomendacionesSourceRef.current, style: estiloMovimiento }),
      ],
      view: new View({ center: fromLonLat([-64, -34]), zoom: 5, maxZoom: 19 }),
    });

    map.on("click", (evento) => {
      const feature = map.forEachFeatureAtPixel(
        evento.pixel,
        (f) => f as OlFeature,
        { layerFilter: (layer) => layer.getSource() === lotesSourceRef.current },
      );
      setLoteSeleccionado((feature?.get("propiedades") as LotePotreroPropiedades) ?? null);
    });

    mapRef.current = map;
    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
      baseTileLayerRef.current = null;
    };
  }, []);

  // ── Actualizar capa base (Satélite Esri / Calles OSM) ──────────────────────
  useEffect(() => {
    if (!baseTileLayerRef.current) return;
    const nuevoSource =
      tipoCapaBase === "satelite"
        ? new XYZ({
            url: ESRI_WORLD_IMAGERY_URL,
            attributions: ESRI_ATTRIBUTIONS,
            maxZoom: 19,
          })
        : new OSM();
    baseTileLayerRef.current.setSource(nuevoSource);
  }, [tipoCapaBase]);

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
        mapRef.current?.getView().fit(extent, { padding: [60, 60, 60, 60], maxZoom: 17 });
        huboAjusteInicialRef.current = true;
      }
    }
  }, [features]);

  // ── Sincronizar las recomendaciones con la capa de flechas ──────────────────
  useEffect(() => {
    recomendacionesSourceRef.current.clear();
    if (!mostrarRecomendaciones) return;
    movimientos.forEach((movimiento) => {
      if (!movimiento.origen_centroide || !movimiento.destino_centroide) return;
      const origen = fromLonLat(movimiento.origen_centroide.coordinates as [number, number]);
      const destino = fromLonLat(movimiento.destino_centroide.coordinates as [number, number]);
      const feature = new OlFeature({ geometry: new LineString([origen, destino]) });
      feature.set("cantidad", movimiento.cantidad_animales);
      recomendacionesSourceRef.current.addFeature(feature);
    });
  }, [movimientos, mostrarRecomendaciones]);

  const detenerInteracciones = () => {
    const map = mapRef.current;
    if (!map) return;
    if (drawInteractionRef.current) {
      map.removeInteraction(drawInteractionRef.current);
      drawInteractionRef.current = null;
    }
    if (modifyInteractionRef.current) {
      map.removeInteraction(modifyInteractionRef.current);
      modifyInteractionRef.current = null;
    }
    snapInteractionsRef.current.forEach((snap) => map.removeInteraction(snap));
    snapInteractionsRef.current = [];
    drawSourceRef.current.clear();
    setModo("ver");
  };

  const agregarSnap = () => {
    const map = mapRef.current;
    if (!map) return;
    const snapKmz = new Snap({ source: kmzSourceRef.current });
    const snapLotes = new Snap({ source: lotesSourceRef.current });
    map.addInteraction(snapKmz);
    map.addInteraction(snapLotes);
    snapInteractionsRef.current = [snapKmz, snapLotes];
  };

  const iniciarDibujo = () => {
    const map = mapRef.current;
    if (!map || !loteParaDibujo) return;
    detenerInteracciones();

    const draw = new Draw({ source: drawSourceRef.current, type: "Polygon" });
    draw.on("drawend", (evento) => {
      const geometria = evento.feature.getGeometry();
      if (!geometria) return;
      const geomGeoJSON = geoJsonFormat.writeGeometryObject(geometria, {
        dataProjection: PROYECCION_DATOS,
        featureProjection: PROYECCION_MAPA,
      }) as GeoJSON.Polygon;
      setPoligonoPendiente(geomGeoJSON);
      detenerInteracciones();
    });
    map.addInteraction(draw);
    drawInteractionRef.current = draw;
    agregarSnap();
    setModo("dibujar");
  };

  const iniciarEdicion = () => {
    const map = mapRef.current;
    if (!map) return;
    detenerInteracciones();

    const modify = new Modify({ source: lotesSourceRef.current });
    modify.on("modifyend", async (evento) => {
      const feature = evento.features.getArray()[0];
      const propiedades = feature?.get("propiedades") as LotePotreroPropiedades | undefined;
      const geometria = feature?.getGeometry();
      if (!feature || !propiedades || !geometria) return;
      const geom = geoJsonFormat.writeGeometryObject(geometria, {
        dataProjection: PROYECCION_DATOS,
        featureProjection: PROYECCION_MAPA,
      }) as GeoJSON.Polygon;
      try {
        await guardarGeometriaLote(propiedades.id, { geom });
        toast.success(`Lote "${propiedades.nombre}" actualizado.`);
        refetchLotes();
      } catch (error) {
        toast.error(
          error instanceof ApiError
            ? normalizeBackendDetail(error.detail)
            : "No se pudo guardar la edición.",
        );
        refetchLotes();
      }
    });
    map.addInteraction(modify);
    modifyInteractionRef.current = modify;
    agregarSnap();
    setModo("editar");
  };

  const confirmarGuardadoPoligono = async (receptividadEvHa?: number) => {
    if (!poligonoPendiente || !loteParaDibujo) return;
    setGuardando(true);
    try {
      await guardarGeometriaLote(Number(loteParaDibujo), {
        geom: poligonoPendiente,
        receptividad_ev_ha: receptividadEvHa,
      });
      toast.success("Lote guardado en el mapa.");
      setPoligonoPendiente(null);
      setLoteParaDibujo("");
      refetchLotes();
      refetchRecomendaciones();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? normalizeBackendDetail(error.detail)
          : "No se pudo guardar el lote.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const eliminarPoligonoSeleccionado = async () => {
    if (!loteSeleccionado) return;
    try {
      await eliminarGeometriaLote(loteSeleccionado.id);
      toast.success(`Se quitó el polígono de "${loteSeleccionado.nombre}".`);
      setLoteSeleccionado(null);
      refetchLotes();
      refetchRecomendaciones();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? normalizeBackendDetail(error.detail)
          : "No se pudo quitar el polígono.",
      );
    }
  };

  const handleKmzCargado = (capa: CapaKmz) => {
    kmzSourceRef.current.clear();
    const kmlFeatures = new KML({ extractStyles: false }).readFeatures(capa.kml, {
      dataProjection: PROYECCION_DATOS,
      featureProjection: PROYECCION_MAPA,
    });
    kmzSourceRef.current.addFeatures(kmlFeatures);

    overlayLayersRef.current.forEach((layer) => mapRef.current?.removeLayer(layer));
    overlayLayersRef.current = capa.groundOverlays.map((overlay) => {
      const extent = [
        ...fromLonLat([overlay.west, overlay.south]),
        ...fromLonLat([overlay.east, overlay.north]),
      ] as Extent;
      const layer = new ImageLayer({
        source: new ImageStatic({
          url: overlay.href,
          imageExtent: extent,
          projection: PROYECCION_MAPA,
        }),
      });
      mapRef.current?.getLayers().insertAt(1, layer);
      return layer;
    });

    const extent = kmzSourceRef.current.getExtent();
    if (extent && !isEmpty(extent)) {
      mapRef.current?.getView().fit(extent, { padding: [60, 60, 60, 60], maxZoom: 17 });
      huboAjusteInicialRef.current = true;
    }
  };

  return (
    <div className="mapa-page">
      <div className="mapa-page__acciones">
        <KmzUploader onCargado={handleKmzCargado} />

        <div className="mapa-page__selector-capas">
          <Button
            size="sm"
            variant={tipoCapaBase === "satelite" ? "solid" : "ghost"}
            colorPalette={tipoCapaBase === "satelite" ? "brand" : "gray"}
            onClick={() => setTipoCapaBase("satelite")}>
            <IconSatellite size={16} stroke={1.75} />
            Satélite (Esri)
          </Button>
          <Button
            size="sm"
            variant={tipoCapaBase === "calles" ? "solid" : "ghost"}
            colorPalette={tipoCapaBase === "calles" ? "brand" : "gray"}
            onClick={() => setTipoCapaBase("calles")}>
            <IconMap size={16} stroke={1.75} />
            Calles (OSM)
          </Button>
        </div>
      </div>

      <DibujoToolbar
        modo={modo}
        lotesSinPoligono={lotesSinPoligono}
        loteParaDibujo={loteParaDibujo}
        onLoteParaDibujoChange={setLoteParaDibujo}
        onIniciarDibujo={iniciarDibujo}
        onIniciarEdicion={iniciarEdicion}
        onCancelar={detenerInteracciones}
        onEliminarSeleccionado={eliminarPoligonoSeleccionado}
        puedeEliminarSeleccionado={loteSeleccionado !== null}
        hayLotesConPoligono={features.length > 0}
      />

      <div className="mapa-page__contenido">
        <div ref={mapDivRef} className="mapa-page__mapa" />

        <LeyendaCarga />

        {loteSeleccionado && (
          <LoteDetallePanel lote={loteSeleccionado} onCerrar={() => setLoteSeleccionado(null)} />
        )}

        <RecomendacionesPanel
          movimientos={movimientos}
          loading={cargandoRecomendaciones}
          visible={mostrarRecomendaciones}
          onToggleVisible={() => setMostrarRecomendaciones((valor) => !valor)}
          onRefrescar={refetchRecomendaciones}
        />
      </div>

      <GuardarPoligonoDialog
        open={poligonoPendiente !== null}
        loteNombre={
          todosLosLotes.find((lote) => lote.id === loteParaDibujo)?.nombre ?? "lote"
        }
        saving={guardando}
        onCancelar={() => setPoligonoPendiente(null)}
        onConfirmar={confirmarGuardadoPoligono}
      />
    </div>
  );
}
