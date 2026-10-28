import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Dialog, Portal, Spinner } from "@chakra-ui/react";
import { IconFocusCentered, IconPolygon } from "@tabler/icons-react";
import { toast } from "react-toastify";
import "ol/ol.css";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import ImageLayer from "ol/layer/Image";
import ImageStatic from "ol/source/ImageStatic";
import KML from "ol/format/KML";
import Draw from "ol/interaction/Draw";
import Modify from "ol/interaction/Modify";
import Snap from "ol/interaction/Snap";
import OlFeature from "ol/Feature";
import type { FeatureLike } from "ol/Feature";
import { unByKey } from "ol/Observable";
import LineString from "ol/geom/LineString";
import Point from "ol/geom/Point";
import OlPolygon from "ol/geom/Polygon";
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

import {
  useMapaCapas,
  escribirPoligonoGeoJSON,
  estiloLote,
  PROYECCION_MAPA,
  PROYECCION_DATOS,
  type TipoCapaBase,
} from "../hooks/useMapaCapas";
import {
  actualizarNdviLote,
  eliminarGeometriaLote,
  getNdviHistorialLote,
  guardarGeometriaLote,
} from "../services/mapaService";
import type {
  CapaKmz,
  LoteNdviHistorial,
  LotePotreroFeature,
  LotePotreroPropiedades,
  Movimiento,
} from "../types";

import { KmzUploader } from "./KmzUploader";
import { DibujoToolbar } from "./DibujoToolbar";
import { LeyendaCarga } from "./LeyendaCarga";
import { RecomendacionesPanel } from "./RecomendacionesPanel";
import { GuardarPoligonoDialog } from "./GuardarPoligonoDialog";
import { VincularKmzDialog } from "./VincularKmzDialog";
import { BuscadorLocalidad } from "./BuscadorLocalidad";
import "./MapaLotes.css";

type Modo = "ver" | "dibujar" | "editar";

function estiloReferenciaKmz(feature: FeatureLike): Style {
  const nombre = feature.get("name") as string | undefined;
  return new Style({
    stroke: new Stroke({ color: "#facc15", width: 2.5, lineDash: [6, 4] }),
    fill: new Fill({ color: "rgba(250, 204, 21, 0.18)" }),
    text: nombre
      ? new Text({
          text: nombre,
          font: "bold 11px sans-serif",
          fill: new Fill({ color: "#ffffff" }),
          backgroundFill: new Fill({ color: "rgba(0, 0, 0, 0.75)" }),
          padding: [2, 5, 2, 5],
        })
      : undefined,
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

  return [
    new Style({ stroke: new Stroke({ color: "#FFD500", width: 3, lineDash: [6, 4] }) }),
    new Style({
      geometry: new Point([x2, y2]),
      image: new RegularShape({
        points: 3,
        radius: 8,
        rotation: Math.PI / 2 - angulo,
        fill: new Fill({ color: "#FFD500" }),
        stroke: new Stroke({ color: "#2d3748", width: 1 }),
      }),
    }),
  ];
}

type Props = {
  features: LotePotreroFeature[];
  onLotesChanged: () => void;
  movimientos: Movimiento[];
  cargandoRecomendaciones: boolean;
  onRecomendacionesChanged: () => void;
  loteSeleccionadoId: number | null;
  loteHoverId?: number | null;
  onLoteClick: (loteId: number) => void;
  onDeselect: () => void;
};

export function MapaLotes({
  features,
  onLotesChanged,
  movimientos,
  cargandoRecomendaciones,
  onRecomendacionesChanged,
  loteSeleccionadoId,
  loteHoverId = null,
  onLoteClick,
  onDeselect,
}: Props) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const kmzSourceRef = useRef(new VectorSource());
  const drawSourceRef = useRef(new VectorSource());
  const recomendacionesSourceRef = useRef(new VectorSource());
  const overlayLayersRef = useRef<ImageLayer<ImageStatic>[]>([]);
  const drawInteractionRef = useRef<Draw | null>(null);
  const modifyInteractionRef = useRef<Modify | null>(null);
  const snapInteractionsRef = useRef<Snap[]>([]);
  const onDeselectRef = useRef(onDeselect);

  const { mapRef, lotesSourceRef, baseTileLayerRef } = useMapaCapas({
    mapDivRef,
    features,
    interactivo: true,
    onLoteClick,
    loteSeleccionadoId,
    loteHoverId,
  });

  const [tipoCapaBase, setTipoCapaBase] = useState<TipoCapaBase>("satelite");
  const [modo, setModo] = useState<Modo>("ver");
  const [toolsOpen, setToolsOpen] = useState(false);
  const [todosLosLotes, setTodosLosLotes] = useState<LoteOption[]>([]);
  const [loteParaDibujo, setLoteParaDibujo] = useState<number | "">("");
  const [poligonoPendiente, setPoligonoPendiente] = useState<GeoJSON.Polygon | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mostrarRecomendaciones, setMostrarRecomendaciones] = useState(true);
  const [poligonoKmzSeleccionado, setPoligonoKmzSeleccionado] = useState<{
    feature: OlFeature;
    geom: GeoJSON.Polygon;
    nombre: string;
  } | null>(null);
  const [vinculandoKmz, setVinculandoKmz] = useState(false);
  const [ndviLote, setNdviLote] = useState<LoteNdviHistorial | null>(null);
  const [ndviLoading, setNdviLoading] = useState(false);
  const [ndviActualizando, setNdviActualizando] = useState(false);
  const [ndviModalOpen, setNdviModalOpen] = useState(false);

  const loteSeleccionado = useMemo(
    () => features.find((f) => f.properties.id === loteSeleccionadoId)?.properties ?? null,
    [features, loteSeleccionadoId],
  );

  const sincronizarNdviEnFeature = useCallback((loteId: number, valor: number | null) => {
    const feature = lotesSourceRef.current.getFeatureById(loteId);
    if (!feature) return;
    feature.set("ndvi_promedio", valor);
    const propiedades = feature.get("propiedades") as LotePotreroPropiedades | undefined;
    if (propiedades) {
      const propiedadesActualizadas = { ...propiedades, ndvi_promedio: valor };
      feature.set("propiedades", propiedadesActualizadas);
      feature.setStyle(
        (featureLike) =>
          estiloLote(
            featureLike,
            loteSeleccionadoId,
            loteHoverId,
            tipoCapaBase === "calles" ? "calle" : "satelite",
          ),
      );
    }
    lotesSourceRef.current.changed();
  }, [loteHoverId, loteSeleccionadoId, tipoCapaBase]);

  const cargarNdviDelLote = useCallback(
    async (loteId: number) => {
      setNdviLoading(true);
      try {
        const historial = await getNdviHistorialLote(loteId);
        const ultimo = historial.at(-1) ?? null;
        setNdviLote(ultimo);
        sincronizarNdviEnFeature(loteId, ultimo?.ndvi_promedio ?? null);
        setNdviModalOpen(true);
      } catch (error) {
        const mensaje =
          error instanceof ApiError ? normalizeBackendDetail(error.detail) : "No se pudo cargar el NDVI del lote.";
        toast.error(mensaje);
      } finally {
        setNdviLoading(false);
      }
    },
    [sincronizarNdviEnFeature],
  );

  useEffect(() => {
    if (!loteSeleccionadoId) {
      return;
    }

    const feature = lotesSourceRef.current.getFeatureById(loteSeleccionadoId);
    if (feature) {
      const propiedades = feature.get("propiedades") as LotePotreroPropiedades | undefined;
      const ndviEnFeature = (feature.get("ndvi_promedio") ?? propiedades?.ndvi_promedio ?? null) as number | null;
      if (ndviEnFeature !== null) {
        setNdviLote((prev) => prev ?? { id: 0, lote_id: loteSeleccionadoId, ndvi_promedio: ndviEnFeature, ndvi_max: null, ndvi_min: null, cloud_cover_percentage: null, fecha_lectura: null });
      }
    }
  }, [features, loteSeleccionadoId]);

  useEffect(() => {
    if (!loteSeleccionadoId) {
      setNdviModalOpen(false);
      setNdviLote(null);
      return;
    }

    void cargarNdviDelLote(loteSeleccionadoId);
  }, [loteSeleccionadoId, cargarNdviDelLote]);

  const lotesSinPoligono = useMemo(() => {
    const idsConPoligono = new Set(
      features.filter((f) => f.geometry !== null).map((f) => f.properties.id),
    );
    return todosLosLotes.filter((lote) => !idsConPoligono.has(lote.id));
  }, [todosLosLotes, features]);

  useEffect(() => {
    getLotes()
      .then(setTodosLosLotes)
      .catch(() => toast.error("No se pudieron cargar los lotes existentes."));
  }, [features]);

  useEffect(() => {
    onDeselectRef.current = onDeselect;
  }, [onDeselect]);

  // ── Agregar las capas propias del mapa grande (KMZ, dibujo, recomendaciones)
  // sobre el `Map` que crea useMapaCapas, y el click para KMZ/deseleccionar. ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const kmzLayer = new VectorLayer({ source: kmzSourceRef.current, style: estiloReferenciaKmz });
    const drawLayer = new VectorLayer({ source: drawSourceRef.current, style: estiloDibujoEnCurso });
    const recomendacionesLayer = new VectorLayer({
      source: recomendacionesSourceRef.current,
      style: estiloMovimiento,
    });
    // Mismo orden que antes: base, kmz, lotes, dibujo, recomendaciones.
    map.getLayers().insertAt(1, kmzLayer);
    map.addLayer(drawLayer);
    map.addLayer(recomendacionesLayer);

    const clickKey = map.on("click", (evento) => {
      const kmzFeature = map.forEachFeatureAtPixel(
        evento.pixel,
        (f) => f as OlFeature,
        { layerFilter: (layer) => layer.getSource() === kmzSourceRef.current },
      );
      if (kmzFeature) {
        const geom = kmzFeature.getGeometry();
        if (geom instanceof OlPolygon) {
          const geomGeoJSON = escribirPoligonoGeoJSON(geom);
          setPoligonoKmzSeleccionado({
            feature: kmzFeature,
            geom: geomGeoJSON,
            nombre: (kmzFeature.get("name") as string) || "",
          });
        }
        return;
      }

      const loteFeature = map.forEachFeatureAtPixel(
        evento.pixel,
        (f) => f as OlFeature,
        { layerFilter: (layer) => layer.getSource() === lotesSourceRef.current },
      );
      if (!loteFeature) onDeselectRef.current();
    });

    return () => {
      unByKey(clickKey);
      map.removeLayer(kmzLayer);
      map.removeLayer(drawLayer);
      map.removeLayer(recomendacionesLayer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se agrega una sola vez, junto con el mapa
  }, [mapRef]);

  // ── Actualizar capa base (Satélite Esri / Calles OSM) ──────────────────────
  useEffect(() => {
    if (!baseTileLayerRef.current) return;
    const nuevoSource =
      tipoCapaBase === "satelite"
        ? new XYZ({
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            attributions:
              "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
            maxZoom: 19,
          })
        : new OSM();
    baseTileLayerRef.current.setSource(nuevoSource);
  }, [tipoCapaBase, baseTileLayerRef]);

  // ── Sincronizar las recomendaciones con la capa de flechas ──────────────────
  useEffect(() => {
    recomendacionesSourceRef.current.clear();
    if (!mostrarRecomendaciones) return;
    movimientos.forEach((movimiento) => {
      if (!movimiento.origen_centroide || !movimiento.destino_centroide) return;
      const origen = fromLonLat(movimiento.origen_centroide.coordinates as [number, number]);
      const destino = fromLonLat(movimiento.destino_centroide.coordinates as [number, number]);
      const feature = new OlFeature({ geometry: new LineString([origen, destino]) });
      recomendacionesSourceRef.current.addFeature(feature);
    });
  }, [movimientos, mostrarRecomendaciones]);

  const actualizarDatosSatelitales = useCallback(async () => {
    if (!loteSeleccionadoId) return;

    setNdviActualizando(true);
    try {
      const actualizado = await actualizarNdviLote(loteSeleccionadoId, {
        dias_atras: 15,
        max_nubosidad_pct: 20,
      });
      setNdviLote(actualizado);
      sincronizarNdviEnFeature(loteSeleccionadoId, actualizado.ndvi_promedio ?? null);
      onLotesChanged();
      window.setTimeout(() => onLotesChanged(), 150);
      toast.success("Datos satelitales actualizados correctamente.");
    } catch (error) {
      const mensaje =
        error instanceof ApiError ? normalizeBackendDetail(error.detail) : "No se pudo actualizar el NDVI del lote.";
      toast.error(mensaje);
    } finally {
      setNdviActualizando(false);
    }
  }, [loteSeleccionadoId, sincronizarNdviEnFeature]);

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
      const geomGeoJSON = escribirPoligonoGeoJSON(geometria);
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
      const geom = escribirPoligonoGeoJSON(geometria);
      try {
        await guardarGeometriaLote(propiedades.id, { geom });
        toast.success(`Lote "${propiedades.nombre}" actualizado.`);
        onLotesChanged();
      } catch (error) {
        toast.error(
          error instanceof ApiError
            ? normalizeBackendDetail(error.detail)
            : "No se pudo guardar la edición.",
        );
        onLotesChanged();
      }
    });
    map.addInteraction(modify);
    modifyInteractionRef.current = modify;
    agregarSnap();
    setModo("editar");
  };

  const confirmarGuardadoPoligono = async () => {
    if (!poligonoPendiente || !loteParaDibujo) return;
    setGuardando(true);
    try {
      await guardarGeometriaLote(Number(loteParaDibujo), {
        geom: poligonoPendiente,
      });
      toast.success("Lote guardado en el mapa.");
      setPoligonoPendiente(null);
      setLoteParaDibujo("");
      onLotesChanged();
      onRecomendacionesChanged();
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
      onDeselect();
      onLotesChanged();
      onRecomendacionesChanged();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? normalizeBackendDetail(error.detail)
          : "No se pudo quitar el polígono.",
      );
    }
  };

  const confirmarVinculacionKmz = async (loteId: number) => {
    if (!poligonoKmzSeleccionado) return;
    setVinculandoKmz(true);
    try {
      await guardarGeometriaLote(loteId, {
        geom: poligonoKmzSeleccionado.geom,
      });
      toast.success("Potrero vinculado exitosamente al lote.");
      kmzSourceRef.current.removeFeature(poligonoKmzSeleccionado.feature);
      setPoligonoKmzSeleccionado(null);
      onLotesChanged();
      onRecomendacionesChanged();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? normalizeBackendDetail(error.detail)
          : "No se pudo vincular el potrero.",
      );
    } finally {
      setVinculandoKmz(false);
    }
  };

  const centrarEnMiCampo = () => {
    const extent = lotesSourceRef.current.getExtent();
    if (extent && !isEmpty(extent)) {
      mapRef.current?.getView().fit(extent, {
        padding: [80, 80, 80, 80],
        maxZoom: 17,
        duration: 800,
      });
      return;
    }
    const kmzExtent = kmzSourceRef.current.getExtent();
    if (kmzExtent && !isEmpty(kmzExtent)) {
      mapRef.current?.getView().fit(kmzExtent, {
        padding: [80, 80, 80, 80],
        maxZoom: 17,
        duration: 800,
      });
      return;
    }
    toast.info("Aún no tienes lotes delimitados en el mapa.");
  };

  const handleSelectLocalidad = ({ lon, lat }: { lon: number; lat: number }) => {
    mapRef.current?.getView().animate({
      center: fromLonLat([lon, lat]),
      zoom: 13,
      duration: 1200,
    });
  };

  const acercarZoom = () => {
    const vista = mapRef.current?.getView();
    const actual = vista?.getZoom();
    if (!vista || actual === undefined) return;
    vista.animate({ zoom: actual + 1, duration: 200 });
  };

  const alejarZoom = () => {
    const vista = mapRef.current?.getView();
    const actual = vista?.getZoom();
    if (!vista || actual === undefined) return;
    vista.animate({ zoom: actual - 1, duration: 200 });
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
    }
  };

  return (
    <div className="mapa-page">
      <div ref={mapDivRef} className="mapa-page__mapa" />

      <div className="mapa-page__overlay-top">
        <div className="mapa-page__top-row">
          <div className="mapa-busqueda-pill">
            <span className="mapa-busqueda-pill__titulo">Mapa del campo</span>
            <span className="mapa-busqueda-pill__divisor" />
            <BuscadorLocalidad onSelectLocalidad={handleSelectLocalidad} />
          </div>

          <KmzUploader onCargado={handleKmzCargado} />
        </div>
      </div>

      <div className="mapa-page__capas">
        <button
          type="button"
          className={`mapa-page__capas-btn${tipoCapaBase === "satelite" ? " mapa-page__capas-btn--activo" : ""}`}
          onClick={() => setTipoCapaBase("satelite")}>
          Satélite
        </button>
        <button
          type="button"
          className={`mapa-page__capas-btn${tipoCapaBase === "calles" ? " mapa-page__capas-btn--activo" : ""}`}
          onClick={() => setTipoCapaBase("calles")}>
          Calles
        </button>
      </div>

      <div className="mapa-page__controles-derecha">
        <button
          type="button"
          className={`mapa-page__control-btn${toolsOpen || modo !== "ver" ? " mapa-page__control-btn--activo" : ""}`}
          onClick={() => setToolsOpen((valor) => !valor)}
          title="Lotes: dibujar y editar">
          <IconPolygon size={20} stroke={1.75} />
        </button>
        <button
          type="button"
          className="mapa-page__control-btn"
          onClick={centrarEnMiCampo}
          title="Centrar en mi campo">
          <IconFocusCentered size={20} stroke={1.75} />
        </button>
        <div className="mapa-page__zoom">
          <button type="button" onClick={acercarZoom} title="Acercar">
            +
          </button>
          <span className="mapa-page__zoom-divisor" />
          <button type="button" onClick={alejarZoom} title="Alejar">
            −
          </button>
        </div>
      </div>

      <DibujoToolbar
        open={toolsOpen && modo === "ver"}
        onClose={() => setToolsOpen(false)}
        modo={modo}
        lotesSinPoligono={lotesSinPoligono}
        loteParaDibujo={loteParaDibujo}
        onLoteParaDibujoChange={setLoteParaDibujo}
        onIniciarDibujo={iniciarDibujo}
        onIniciarEdicion={iniciarEdicion}
        onCancelar={detenerInteracciones}
        onEliminarSeleccionado={eliminarPoligonoSeleccionado}
        puedeEliminarSeleccionado={loteSeleccionado !== null}
      />

      <LeyendaCarga />

      <RecomendacionesPanel
        movimientos={movimientos}
        loading={cargandoRecomendaciones}
        visible={mostrarRecomendaciones}
        onToggleVisible={() => setMostrarRecomendaciones((valor) => !valor)}
      />

      <GuardarPoligonoDialog
        open={poligonoPendiente !== null}
        loteNombre={
          todosLosLotes.find((lote) => lote.id === loteParaDibujo)?.nombre ?? "lote"
        }
        saving={guardando}
        onCancelar={() => setPoligonoPendiente(null)}
        onConfirmar={confirmarGuardadoPoligono}
      />

      <VincularKmzDialog
        open={poligonoKmzSeleccionado !== null}
        nombreDetectado={poligonoKmzSeleccionado?.nombre ?? ""}
        lotesDisponibles={lotesSinPoligono}
        saving={vinculandoKmz}
        onCancelar={() => setPoligonoKmzSeleccionado(null)}
        onConfirmar={confirmarVinculacionKmz}
      />

      <Dialog.Root
        open={ndviModalOpen && loteSeleccionado !== null}
        onOpenChange={(details) => {
          if (!details.open) {
            setNdviModalOpen(false);
            setNdviLote(null);
            onDeselect();
          }
        }}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>{loteSeleccionado?.nombre ?? "Lote"}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                {ndviLoading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Spinner size="sm" />
                    <span>Cargando lectura NDVI...</span>
                  </div>
                ) : ndviLote ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    <div>
                      <strong>NDVI promedio:</strong> {ndviLote.ndvi_promedio?.toFixed(4) ?? "Sin datos"}
                    </div>
                    <div>
                      <strong>Fecha lectura:</strong> {ndviLote.fecha_lectura ?? "Sin datos"}
                    </div>
                    <div>
                      <strong>Nubosidad:</strong> {ndviLote.cloud_cover_percentage ?? 0}%
                    </div>
                  </div>
                ) : (
                  <span>No hay lectura NDVI disponible para este lote.</span>
                )}
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="outline" onClick={() => setNdviModalOpen(false)}>
                  Cerrar
                </Button>
                <Button
                  colorPalette="green"
                  onClick={actualizarDatosSatelitales}
                  disabled={ndviActualizando || ndviLoading || loteSeleccionado === null}>
                  {ndviActualizando ? <Spinner size="xs" /> : "Actualizar Datos Satelitales"}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </div>
  );
}
