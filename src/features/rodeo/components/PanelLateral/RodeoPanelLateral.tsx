import { useAnimalesDashboard } from "@/features/animales/hooks/useAnimalesDashboard";
import { MiniHistogramaCC } from "@/features/animales/components/dashboard/MiniHistogramaCC";
import type { LotePotreroPropiedades } from "@/features/mapa/types";
import type { CategoriaAnimal } from "@/features/animales/types";
import { RodeoBreadcrumb } from "../RodeoBreadcrumb";
import { RodeoPanelHeader } from "./RodeoPanelHeader";
import { RodeoResumenLote } from "./RodeoResumenLote";
import { RodeoResumenGeneral } from "./RodeoResumenGeneral";
import { RodeoFiltrosPanel } from "./RodeoFiltrosPanel";
import { RodeoListaAnimales } from "./RodeoListaAnimales";
import { RodeoPanelFooter } from "./RodeoPanelFooter";

type Props = {
  lote: LotePotreroPropiedades | null;
  lotes: LotePotreroPropiedades[];
  busquedaCaravana: string;
  busquedaCaravanaDebounced: string;
  sexo: "MACHO" | "HEMBRA" | null;
  categoriaLote: CategoriaAnimal | null;
  onCaravanaChange: (value: string) => void;
  onSexoChange: (value: "MACHO" | "HEMBRA" | null) => void;
  onCategoriaLoteChange: (value: CategoriaAnimal | null) => void;
  onExpand: () => void;
  onClose: () => void;
  onClearSeleccion: () => void;
  onAgregarAnimal: () => void;
  onLoteHover?: (loteId: number | null) => void;
};

export function RodeoPanelLateral({
  lote,
  lotes,
  busquedaCaravana,
  busquedaCaravanaDebounced,
  sexo,
  categoriaLote,
  onCaravanaChange,
  onSexoChange,
  onCategoriaLoteChange,
  onExpand,
  onClose,
  onClearSeleccion,
  onAgregarAnimal,
  onLoteHover,
}: Props) {
  const { data, loading } = useAnimalesDashboard(lote?.id ?? null);

  return (
    <aside className="rodeo-panel">
      <div className="rodeo-panel__cabecera">
        <RodeoPanelHeader
          breadcrumb={
            <RodeoBreadcrumb
              loteNombre={lote?.nombre}
              onClear={onClearSeleccion}
            />
          }
          onExpand={onExpand}
          onClose={onClose}
        />
        {lote ? (
          <RodeoResumenLote
            lote={lote}
            criticos={data?.alertas.length ?? 0}
            loadingCriticos={loading}
          />
        ) : (
          <RodeoResumenGeneral
            totalLotes={lotes.length}
            data={data}
            loading={loading}
          />
        )}
        {/* {data && <MiniHistogramaCC histograma={data.histograma} />} */}
      </div>

      <RodeoFiltrosPanel
        caravanaInput={busquedaCaravana}
        sexo={sexo}
        categoriaLote={categoriaLote}
        onCaravanaChange={onCaravanaChange}
        onSexoChange={onSexoChange}
        onCategoriaLoteChange={onCategoriaLoteChange}
      />

      <RodeoListaAnimales
        lote={lote}
        lotes={lotes}
        busquedaCaravana={busquedaCaravanaDebounced}
        sexo={sexo}
        categoriaLote={categoriaLote}
        onLoteHover={onLoteHover}
      />

      <RodeoPanelFooter
        hasSel={lote !== null}
        onVerDashboard={onExpand}
        onAgregarAnimal={onAgregarAnimal}
      />
    </aside>
  );
}
