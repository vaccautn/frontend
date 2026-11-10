import { MovimientoAnimales } from "@/features/animales/components/MovimientoAnimales";
import { Paginador } from "@/components/ui/Paginador";
import { usePageState } from "@/hooks/usePageState";
import type { CcAnimal } from "@/features/animales/components/AnimalesTabla";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AgregarAnimalMenu } from "@/features/animales/components/AgregarAnimalMenu";
import { getLotes } from "@/features/lotes/services/lotesService";
import { LotesDrawer } from "@/features/lotes/components/LotesDrawer";
import type { LoteOption } from "@/features/lotes/types";
import { getAnimalesPagina } from "@/features/animales/services/animalesService";
import { AnimalesFiltros } from "@/features/animales/components/AnimalesFiltros";
import { AnimalesTabla } from "@/features/animales/components/AnimalesTabla";
import {
  rangoDeAlta,
  type FiltroAlta,
} from "@/features/animales/utils/filtroAlta";
import type {
  Animal,
  CategoriaAnimal,
  EstadoFiltro,
} from "@/features/animales/types";
import type { LotePotreroFeature } from "@/features/mapa/types";

import { RodeoMinimapa } from "./RodeoMinimapa";
import { RodeoLoteSelector } from "./RodeoLoteSelector";

type Props = {
  features: LotePotreroFeature[];
  loteSeleccionadoId: number | null;
  onLoteClick: (loteId: number) => void;
  onClearSeleccion: () => void;
  busquedaCaravana: string;
  busquedaCaravanaDebounced: string;
  categoriaLote: CategoriaAnimal | null;
  onCaravanaChange: (value: string) => void;
  onCategoriaLoteChange: (value: CategoriaAnimal | null) => void;
  onVolverAlMapa: () => void;
  onAgregarAnimal: () => void;
  onImportarAnimales: () => void;
};

export function RodeoDashboardCompleto({
  features,
  loteSeleccionadoId,
  onLoteClick,
  onClearSeleccion,
  busquedaCaravana,
  busquedaCaravanaDebounced,
  categoriaLote,
  onCaravanaChange,
  onCategoriaLoteChange,
  onVolverAlMapa,
  onAgregarAnimal,
  onImportarAnimales,
}: Props) {
  const [raza, setRaza] = usePageState<string | null>("rodeo.raza", null);
  const [estado, setEstado] = usePageState<EstadoFiltro | null>(
    "rodeo.estado",
    "ACTIVO",
  );
  const [alta, setAlta] = useState<FiltroAlta | null>(null);
  const [isLotesDrawerOpen, setIsLotesDrawerOpen] = useState(false);

  const [lotesOptions, setLotesOptions] = useState<LoteOption[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(true);
  const fetchLotesOptions = useCallback(() => {
    setLoadingLotes(true);
    getLotes()
      .then(setLotesOptions)
      .finally(() => setLoadingLotes(false));
  }, []);
  useEffect(() => {
    void Promise.resolve().then(fetchLotesOptions);
  }, [fetchLotesOptions]);

  const lotePorId = useMemo(() => {
    const map = new Map<number, LoteOption>();
    lotesOptions.forEach((l) => map.set(l.id, l));
    return map;
  }, [lotesOptions]);

  const lotes = useMemo(() => features.map((f) => f.properties), [features]);
  const totalAnimalesRodeo = useMemo(
    () => lotes.reduce((suma, l) => suma + l.cantidad_animales, 0),
    [lotes],
  );

  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [revision, setRevision] = useState(0);
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [loadingAnimales, setLoadingAnimales] = useState(true);
  const [errorAnimales, setErrorAnimales] = useState("");
  const [total, setTotal] = useState(0);
  const [ccPorAnimal, setCcPorAnimal] = useState<Map<number, CcAnimal>>(
    new Map(),
  );
  const [paginacion, setPaginacion] = usePageState("rodeo.pagina", {
    key: "",
    pagina: 0,
  });
  const filtroKey = JSON.stringify([
    estado,
    raza,
    busquedaCaravanaDebounced,
    loteSeleccionadoId,
    categoriaLote,
    alta,
  ]);
  const pagina = paginacion.key === filtroKey ? paginacion.pagina : 0;
  const cambiarPagina = (value: number) =>
    setPaginacion({ key: filtroKey, pagina: value });
  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      setSeleccionados(new Set());
      setLoadingAnimales(true);
      setErrorAnimales("");
      getAnimalesPagina(
        {
          ...(estado ? { estado } : {}),
          ...(raza ? { raza } : {}),
          ...(busquedaCaravanaDebounced
            ? { caravana: busquedaCaravanaDebounced }
            : {}),
          ...(loteSeleccionadoId !== null
            ? { lote_id: loteSeleccionadoId }
            : {}),
          ...rangoDeAlta(alta),
        },
        pagina,
        categoriaLote,
      )
        .then((data) => {
          if (!cancelled) {
            setAnimales(data.items);
            setTotal(data.total);
            setCcPorAnimal(
              new Map(
                Object.entries(data.cc).map(([id, cc]) => [Number(id), cc]),
              ),
            );
          }
        })
        .catch(() => {
          if (!cancelled)
            setErrorAnimales(
              "No se pudieron cargar los animales. Intent? nuevamente.",
            );
        })
        .finally(() => {
          if (!cancelled) setLoadingAnimales(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [
    estado,
    raza,
    busquedaCaravanaDebounced,
    loteSeleccionadoId,
    categoriaLote,
    alta,
    pagina,
    revision,
  ]);
  const animalesFiltrados = animales;

  const handleLoteNombreClick = (loteIdClickeado: number) => {
    onLoteClick(loteIdClickeado);
    onVolverAlMapa();
  };

  return (
    <div className="rodeo-dashboard-full">
      <div className="rodeo-dashboard-full__inner">
        <div className="rodeo-dashboard-full__header">
          <div className="rodeo-dashboard-full__titulo">
            <h1>Gestión de animales</h1>
            <AgregarAnimalMenu
              placement="bottom-start"
              onAgregar={onAgregarAnimal}
              onImportar={onImportarAnimales}
            />
          </div>
        </div>

        <LotesDrawer
          open={isLotesDrawerOpen}
          onClose={() => setIsLotesDrawerOpen(false)}
          lotes={lotesOptions}
          onChanged={fetchLotesOptions}
        />

        {/* Las estadísticas del rodeo están en Inicio. */}
        <div className="right-col">
          <RodeoMinimapa
            features={features}
            loteSeleccionadoId={loteSeleccionadoId}
            onLoteClick={onLoteClick}
            onAbrirMapa={onVolverAlMapa}
            onAbrirLotes={() => setIsLotesDrawerOpen(true)}
          />
          <div className="rodeo-dashboard-full__tabla-card">
            <div className="rodeo-dashboard-full__tabla-header">
              <div className="rodeo-dashboard-full__tabla-header-top">
                <span className="rodeo-dashboard-full__tabla-titulo">
                  Animales
                </span>
              </div>
              <div className="rodeo-dashboard-full__tabla-header-top">
                <RodeoLoteSelector
                  lotes={lotes}
                  loteSeleccionadoId={loteSeleccionadoId}
                  totalAnimales={totalAnimalesRodeo}
                  onSelect={(id) =>
                    id === null ? onClearSeleccion() : onLoteClick(id)
                  }
                />
                <AnimalesFiltros
                  caravanaInput={busquedaCaravana}
                  categoriaLote={categoriaLote}
                  onCaravanaChange={onCaravanaChange}
                  onCategoriaLoteChange={onCategoriaLoteChange}
                  camposVisibles={["caravana"]}
                />
              </div>
            </div>

            <div className="rodeo-dashboard-full__tabla-filtros">
              <AnimalesFiltros
                caravanaInput={busquedaCaravana}
                raza={raza}
                estado={estado}
                categoriaLote={categoriaLote}
                alta={alta}
                lotes={lotesOptions}
                loadingLotes={loadingLotes}
                onCaravanaChange={onCaravanaChange}
                onRazaChange={setRaza}
                onEstadoChange={setEstado}
                onCategoriaLoteChange={onCategoriaLoteChange}
                onAltaChange={setAlta}
                camposVisibles={["categoria", "raza", "estado", "alta"]}
              />
            </div>

            <Paginador pagina={pagina} total={total} onChange={cambiarPagina} />
            <MovimientoAnimales
              animales={animales.filter((a) => seleccionados.has(a.id))}
              lotes={lotesOptions}
              onMovidos={() => {
                setSeleccionados(new Set());
                setRevision((r) => r + 1);
              }}
            />
            <AnimalesTabla
              seleccionados={seleccionados}
              onSeleccionar={(id) =>
                setSeleccionados((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                })
              }
              animales={animalesFiltrados}
              lotePorId={lotePorId}
              ccPorAnimal={ccPorAnimal}
              onLoteNombreClick={handleLoteNombreClick}
              loading={loadingAnimales}
              error={errorAnimales}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
