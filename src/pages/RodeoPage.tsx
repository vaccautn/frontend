import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { MapaLotes } from "@/features/mapa/components/MapaLotes";
import { useMapaLotes } from "@/features/mapa/hooks/useMapaLotes";
import { useRecomendaciones } from "@/features/mapa/hooks/useRecomendaciones";
import { RodeoPanelLateral } from "@/features/rodeo/components/PanelLateral/RodeoPanelLateral";
import { RodeoPestanaFlotante } from "@/features/rodeo/components/RodeoPestanaFlotante";
import { RodeoDashboardCompleto } from "@/features/rodeo/components/DashboardCompleto/RodeoDashboardCompleto";
import type { CategoriaAnimal } from "@/features/animales/types";
import "@/features/rodeo/rodeo.css";

type RodeoMode = "closed" | "docked" | "full";

const DEBOUNCE_MS = 300;

export function RodeoPage() {
  const navigate = useNavigate();
  const { features, refetch: refetchLotes } = useMapaLotes();
  const {
    movimientos,
    loading: cargandoRecomendaciones,
    refetch: refetchRecomendaciones,
  } = useRecomendaciones();

  const [mode, setMode] = useState<RodeoMode>("full");
  const [loteSeleccionadoId, setLoteSeleccionadoId] = useState<number | null>(null);
  const [loteHoverId, setLoteHoverId] = useState<number | null>(null);

  const [busquedaCaravana, setBusquedaCaravana] = useState("");
  const [busquedaCaravanaDebounced, setBusquedaCaravanaDebounced] = useState("");
  const [categoriaLote, setCategoriaLote] = useState<CategoriaAnimal | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBusquedaCaravanaDebounced(busquedaCaravana);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [busquedaCaravana]);

  const handleLoteClick = useCallback((loteId: number) => {
    setLoteSeleccionadoId((actual) => (actual === loteId ? null : loteId));
  }, []);

  const handleDeselect = useCallback(() => setLoteSeleccionadoId(null), []);

  const lotes = useMemo(() => features.map((f) => f.properties), [features]);

  const loteSeleccionado = useMemo(
    () => lotes.find((l) => l.id === loteSeleccionadoId) ?? null,
    [lotes, loteSeleccionadoId],
  );

  const totalAnimales = useMemo(
    () => lotes.reduce((suma, l) => suma + l.cantidad_animales, 0),
    [lotes],
  );
  const textoPestana = loteSeleccionado
    ? loteSeleccionado.nombre
    : `Rodeo · ${totalAnimales} animales`;

  return (
    <>
      <div className="rodeo-layout">
        {mode !== "full" && (
          <MapaLotes
            features={features}
            onLotesChanged={refetchLotes}
            movimientos={movimientos}
            cargandoRecomendaciones={cargandoRecomendaciones}
            onRecomendacionesChanged={refetchRecomendaciones}
            loteSeleccionadoId={loteSeleccionadoId}
            loteHoverId={loteHoverId}
            onLoteClick={handleLoteClick}
            onDeselect={handleDeselect}
          />
        )}
        {mode === "docked" && (
          <RodeoPanelLateral
            lote={loteSeleccionado}
            lotes={lotes}
            onLoteHover={setLoteHoverId}
            busquedaCaravana={busquedaCaravana}
            busquedaCaravanaDebounced={busquedaCaravanaDebounced}
            categoriaLote={categoriaLote}
            onCaravanaChange={setBusquedaCaravana}
            onCategoriaLoteChange={setCategoriaLote}
            onExpand={() => setMode("full")}
            onClose={() => setMode("closed")}
            onClearSeleccion={handleDeselect}
            onAgregarAnimal={() => navigate("/rodeo/nuevo")}
            onImportarAnimales={() => navigate("/rodeo/importar")}
          />
        )}
        {mode === "closed" && (
          <RodeoPestanaFlotante texto={textoPestana} onClick={() => setMode("docked")} />
        )}
        {mode === "full" && (
          <RodeoDashboardCompleto
            features={features}
            lote={loteSeleccionado}
            loteSeleccionadoId={loteSeleccionadoId}
            onLoteClick={handleLoteClick}
            onClearSeleccion={handleDeselect}
            busquedaCaravana={busquedaCaravana}
            busquedaCaravanaDebounced={busquedaCaravanaDebounced}
            categoriaLote={categoriaLote}
            onCaravanaChange={setBusquedaCaravana}
            onCategoriaLoteChange={setCategoriaLote}
            onVolverAlMapa={() => setMode("docked")}
            onAgregarAnimal={() => navigate("/rodeo/nuevo")}
            onImportarAnimales={() => navigate("/rodeo/importar")}
            movimientos={movimientos}
            cargandoRecomendaciones={cargandoRecomendaciones}
            onRefrescarRecomendaciones={refetchRecomendaciones}
          />
        )}
      </div>
      <Outlet />
    </>
  );
}
