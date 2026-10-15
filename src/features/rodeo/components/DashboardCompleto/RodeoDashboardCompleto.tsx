import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button } from "@chakra-ui/react";
import { IconArrowBackUp, IconPlus, IconStack2 } from "@tabler/icons-react";
import { getLotes } from "@/features/lotes/services/lotesService";
import { LotesDrawer } from "@/features/lotes/components/LotesDrawer";
import type { LoteOption } from "@/features/lotes/types";
import { getAnimales } from "@/features/animales/services/animalesService";
import { AnimalesFiltros } from "@/features/animales/components/AnimalesFiltros";
import { AnimalesTabla } from "@/features/animales/components/AnimalesTabla";
import { DashboardHistograma } from "@/features/animales/components/dashboard/DashboardHistograma";
import { DashboardEvolucion } from "@/features/animales/components/dashboard/DashboardEvolucion";
import { useAnimalesDashboard } from "@/features/animales/hooks/useAnimalesDashboard";
import { useVacasPrenadas } from "@/features/animales/hooks/useVacasPrenadas";
import type {
  Animal,
  CategoriaAnimal,
  EstadoFiltro,
} from "@/features/animales/types";
import type {
  LotePotreroFeature,
  LotePotreroPropiedades,
  Movimiento,
} from "@/features/mapa/types";
import { useCcPorAnimal } from "../../hooks/useCcPorAnimal";
import { RodeoBreadcrumb } from "../RodeoBreadcrumb";
import { RodeoMinimapa } from "./RodeoMinimapa";
import { RodeoResumenCompacto } from "./RodeoResumenCompacto";
import { RodeoLoteSelector } from "./RodeoLoteSelector";
import { RodeoMovimientosCard } from "./RodeoMovimientosCard";

type Props = {
  features: LotePotreroFeature[];
  lote: LotePotreroPropiedades | null;
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
  movimientos: Movimiento[];
  cargandoRecomendaciones: boolean;
  onRefrescarRecomendaciones: () => void;
};

export function RodeoDashboardCompleto({
  features,
  lote,
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
  movimientos,
  cargandoRecomendaciones,
  onRefrescarRecomendaciones,
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
  const totalHa = useMemo(
    () => lotes.reduce((suma, l) => suma + (l.superficie_ha ?? 0), 0),
    [lotes],
  );
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

  const { data: dashboard, loading: loadingDashboard } =
    useAnimalesDashboard(loteSeleccionadoId);
  const { count: vacasPrenadas, loading: loadingVacasPrenadas } =
    useVacasPrenadas(loteSeleccionadoId);

  // El histograma agrega evaluaciones de cualquier mes; se usa la fecha de la
  // evaluación más reciente como referencia para resolver el nivel de alerta
  // (mismo criterio "estado actual" que AnimalDashboard/SesionDashboard).
  const evolucion = dashboard?.evolucion ?? [];
  const fechaReferencia =
    evolucion.length > 0
      ? `${evolucion[evolucion.length - 1].periodo}-01`
      : new Date().toISOString();

  const handleLoteNombreClick = (loteIdClickeado: number) => {
    onLoteClick(loteIdClickeado);
    onVolverAlMapa();
  };

  return (
    <div className="rodeo-dashboard-full">
      <div className="rodeo-dashboard-full__inner">
        <div className="rodeo-dashboard-full__header">
          <div>
            <RodeoBreadcrumb
              loteNombre={lote?.nombre}
              onClear={onClearSeleccion}
            />
            <h1>Gestión de animales</h1>
          </div>
          <div className="rodeo-dashboard-full__header-acciones">
            <Button
              variant="outline"
              bg="var(--panel)"
              onClick={onVolverAlMapa}>
              <IconArrowBackUp size={18} stroke={1.5} />
              Volver al mapa
            </Button>
            <Button
              variant="outline"
              bg="var(--panel)"
              onClick={() => setIsLotesDrawerOpen(true)}>
              <IconStack2 size={18} stroke={1.5} />
              Lotes
            </Button>
            <Button colorPalette="brand" onClick={onAgregarAnimal}>
              <IconPlus size={18} stroke={1.5} />
              Agregar animal
            </Button>
          </div>
        </div>

        <LotesDrawer
          open={isLotesDrawerOpen}
          onClose={() => setIsLotesDrawerOpen(false)}
          lotes={lotesOptions}
          onChanged={fetchLotesOptions}
        />

        <div className="rodeo-dashboard-full__bento">
          <div className="rodeo-dashboard-full__sidebar">
            <RodeoResumenCompacto
              lote={lote}
              totalLotes={lotes.length}
              totalHa={totalHa}
              dashboard={dashboard}
              loadingDashboard={loadingDashboard}
              vacasPrenadas={vacasPrenadas}
              loadingVacasPrenadas={loadingVacasPrenadas}
            />

            <Box className="rodeo-dashboard-full__card">
              <DashboardHistograma
                histograma={dashboard?.histograma ?? []}
                loading={loadingDashboard}
                fecha={fechaReferencia}
              />
            </Box>

            <Box className="rodeo-dashboard-full__card">
              <DashboardEvolucion
                evolucion={dashboard?.evolucion ?? []}
                loading={loadingDashboard}
              />
            </Box>

            <RodeoMovimientosCard
              movimientos={movimientos}
              loading={cargandoRecomendaciones}
              onRefrescar={onRefrescarRecomendaciones}
            />
          </div>
          <div className="right-col">
            <RodeoMinimapa
              features={features}
              loteSeleccionadoId={loteSeleccionadoId}
              onLoteClick={onLoteClick}
              onAbrirMapa={onVolverAlMapa}
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
    </div>
  );
}
