import { useCallback, useEffect, useMemo, useState } from "react";
import { AgregarAnimalMenu } from "@/features/animales/components/AgregarAnimalMenu";
import { getLotes } from "@/features/lotes/services/lotesService";
import { LotesDrawer } from "@/features/lotes/components/LotesDrawer";
import type { LoteOption } from "@/features/lotes/types";
import { getAnimales } from "@/features/animales/services/animalesService";
import { AnimalesFiltros } from "@/features/animales/components/AnimalesFiltros";
import { AnimalesTabla } from "@/features/animales/components/AnimalesTabla";
import type {
  Animal,
  CategoriaAnimal,
  EstadoFiltro,
} from "@/features/animales/types";
import type {
  LotePotreroFeature,
} from "@/features/mapa/types";
import { useCcPorAnimal } from "../../hooks/useCcPorAnimal";
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
  const [raza, setRaza] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoFiltro | null>("ACTIVO");
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
    fetchLotesOptions();
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

  const [animales, setAnimales] = useState<Animal[]>([]);
  const [loadingAnimales, setLoadingAnimales] = useState(true);
  useEffect(() => {
    setLoadingAnimales(true);
    getAnimales({
      ...(estado ? { estado } : {}),
      ...(raza ? { raza } : {}),
      ...(busquedaCaravanaDebounced
        ? { caravana: busquedaCaravanaDebounced }
        : {}),
      ...(loteSeleccionadoId !== null ? { lote_id: loteSeleccionadoId } : {}),
    })
      .then(setAnimales)
      .catch(() => setAnimales([]))
      .finally(() => setLoadingAnimales(false));
  }, [estado, raza, busquedaCaravanaDebounced, loteSeleccionadoId]);

  const animalesFiltrados = useMemo(() => {
    if (!categoriaLote) return animales;
    return animales.filter(
      (a) =>
        a.lote_id !== null &&
        lotePorId.get(a.lote_id)?.categoria === categoriaLote,
    );
  }, [animales, categoriaLote, lotePorId]);

  const loteIds = useMemo(
    () => [
      ...new Set(
        animalesFiltrados
          .map((a) => a.lote_id)
          .filter((id): id is number => id !== null),
      ),
    ],
    [animalesFiltrados],
  );
  const { ccPorAnimal } = useCcPorAnimal(loteIds);

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
                lotes={lotesOptions}
                loadingLotes={loadingLotes}
                onCaravanaChange={onCaravanaChange}
                onRazaChange={setRaza}
                onEstadoChange={setEstado}
                onCategoriaLoteChange={onCategoriaLoteChange}
                camposVisibles={["categoria", "raza", "estado"]}
              />
            </div>

            <AnimalesTabla
              animales={animalesFiltrados}
              lotePorId={lotePorId}
              ccPorAnimal={ccPorAnimal}
              onLoteNombreClick={handleLoteNombreClick}
              loading={loadingAnimales}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
