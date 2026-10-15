import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button } from "@chakra-ui/react";
import { IconArrowBackUp, IconPlus, IconStack2 } from "@tabler/icons-react";
import { getLotes } from "@/features/lotes/services/lotesService";
import { LotesDrawer } from "@/features/lotes/components/LotesDrawer";
import type { LoteOption } from "@/features/lotes/types";
import { getAnimales } from "@/features/animales/services/animalesService";
import { AnimalesFiltros } from "@/features/animales/components/AnimalesFiltros";
import { AnimalesTabla } from "@/features/animales/components/AnimalesTabla";
import { KpiCriticos } from "@/features/animales/components/dashboard/KpiCriticos";
import { KpiEvaluados } from "@/features/animales/components/dashboard/KpiEvaluados";
import { KpiVacasPrenadas } from "@/features/animales/components/dashboard/KpiVacasPrenadas";
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
} from "@/features/mapa/types";
import { useCcPorAnimal } from "../../hooks/useCcPorAnimal";
import { RodeoBreadcrumb } from "../RodeoBreadcrumb";
import { RodeoMinimapa } from "./RodeoMinimapa";

type Props = {
  features: LotePotreroFeature[];
  lote: LotePotreroPropiedades | null;
  loteSeleccionadoId: number | null;
  onLoteClick: (loteId: number) => void;
  onClearSeleccion: () => void;
  busquedaCaravana: string;
  busquedaCaravanaDebounced: string;
  sexo: "MACHO" | "HEMBRA" | null;
  categoriaLote: CategoriaAnimal | null;
  onCaravanaChange: (value: string) => void;
  onSexoChange: (value: "MACHO" | "HEMBRA" | null) => void;
  onCategoriaLoteChange: (value: CategoriaAnimal | null) => void;
  onVolverAlMapa: () => void;
  onAgregarAnimal: () => void;
};

export function RodeoDashboardCompleto({
  features,
  lote,
  loteSeleccionadoId,
  onLoteClick,
  onClearSeleccion,
  busquedaCaravana,
  busquedaCaravanaDebounced,
  sexo,
  categoriaLote,
  onCaravanaChange,
  onSexoChange,
  onCategoriaLoteChange,
  onVolverAlMapa,
  onAgregarAnimal,
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

  const [animales, setAnimales] = useState<Animal[]>([]);
  const [loadingAnimales, setLoadingAnimales] = useState(true);
  useEffect(() => {
    setLoadingAnimales(true);
    getAnimales({
      ...(estado ? { estado } : {}),
      ...(sexo ? { sexo } : {}),
      ...(raza ? { raza } : {}),
      ...(busquedaCaravanaDebounced
        ? { caravana: busquedaCaravanaDebounced }
        : {}),
      ...(loteSeleccionadoId !== null ? { lote_id: loteSeleccionadoId } : {}),
    })
      .then(setAnimales)
      .catch(() => setAnimales([]))
      .finally(() => setLoadingAnimales(false));
  }, [estado, sexo, raza, busquedaCaravanaDebounced, loteSeleccionadoId]);

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

        <Box
          bg="var(--panel)"
          border="1px solid"
          borderColor="var(--border)"
          borderRadius="10px"
          p="4"
          display="flex"
          flexDirection="column"
          gap="4">
          <div className="rodeo-dashboard-full__card-header">
            <span>DASHBOARD DEL RODEO</span>
            <AnimalesFiltros
              caravanaInput={busquedaCaravana}
              sexo={sexo}
              categoriaLote={categoriaLote}
              loteId={loteSeleccionadoId}
              lotes={lotesOptions}
              loadingLotes={loadingLotes}
              onCaravanaChange={onCaravanaChange}
              onSexoChange={onSexoChange}
              onCategoriaLoteChange={onCategoriaLoteChange}
              onLoteChange={(value) => {
                if (value === null) {
                  onClearSeleccion();
                } else {
                  onLoteClick(value);
                }
              }}
              camposVisibles={["categoria", "lote"]}
            />
          </div>

          <div className="rodeo-dashboard-full__grid">
            <RodeoMinimapa
              features={features}
              loteSeleccionadoId={loteSeleccionadoId}
              onLoteClick={onLoteClick}
              onAbrirMapa={onVolverAlMapa}
            />
            <KpiCriticos
              count={dashboard?.alertas.length ?? 0}
              loading={loadingDashboard}
            />
            <KpiEvaluados
              total={dashboard?.total_animales_activos ?? 0}
              evaluados={dashboard?.total_animales_evaluados ?? 0}
              loading={loadingDashboard}
            />
            <KpiVacasPrenadas count={vacasPrenadas} loading={loadingVacasPrenadas} />
            <div className="rodeo-dashboard-full__histograma">
              <DashboardHistograma
                histograma={dashboard?.histograma ?? []}
                loading={loadingDashboard}
                fecha={fechaReferencia}
              />
            </div>
            <div className="rodeo-dashboard-full__evolucion">
              <DashboardEvolucion
                evolucion={dashboard?.evolucion ?? []}
                loading={loadingDashboard}
              />
            </div>
          </div>
        </Box>

        <AnimalesFiltros
          caravanaInput={busquedaCaravana}
          sexo={sexo}
          raza={raza}
          estado={estado}
          loteId={loteSeleccionadoId}
          categoriaLote={categoriaLote}
          lotes={lotesOptions}
          loadingLotes={loadingLotes}
          onCaravanaChange={onCaravanaChange}
          onSexoChange={onSexoChange}
          onRazaChange={setRaza}
          onEstadoChange={setEstado}
          onCategoriaLoteChange={onCategoriaLoteChange}
          onLoteChange={(value) => {
            if (value === null) {
              onClearSeleccion();
            } else {
              onLoteClick(value);
            }
          }}
        />

        <AnimalesTabla
          animales={animalesFiltrados}
          lotePorId={lotePorId}
          ccPorAnimal={ccPorAnimal}
          onLoteNombreClick={handleLoteNombreClick}
          loading={loadingAnimales}
        />
      </div>
    </div>
  );
}
