import { useAnimalesDashboard } from "@/features/animales/hooks/useAnimalesDashboard";

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
  categoriaLote: CategoriaAnimal | null;
  onCaravanaChange: (value: string) => void;
  onCategoriaLoteChange: (value: CategoriaAnimal | null) => void;
  onExpand: () => void;
  onClose: () => void;
  onClearSeleccion: () => void;
  onAgregarAnimal: () => void;
  onImportarAnimales: () => void;
  onLoteHover?: (loteId: number | null) => void;
};

export function RodeoPanelLateral({
  lote,
  lotes,
  busquedaCaravana,
  busquedaCaravanaDebounced,
  categoriaLote,
  onCaravanaChange,
  onCategoriaLoteChange,
  onExpand,
  onClose,
  onClearSeleccion,
  onAgregarAnimal,
  onImportarAnimales,
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
      </div>

      <RodeoFiltrosPanel
        caravanaInput={busquedaCaravana}
        categoriaLote={categoriaLote}
        onCaravanaChange={onCaravanaChange}
        onCategoriaLoteChange={onCategoriaLoteChange}
      />

      <RodeoListaAnimales
        lote={lote}
        lotes={lotes}
        busquedaCaravana={busquedaCaravanaDebounced}
        categoriaLote={categoriaLote}
        onLoteHover={onLoteHover}
      />

      <RodeoPanelFooter
        hasSel={lote !== null}
        onVerDashboard={onExpand}
        onAgregarAnimal={onAgregarAnimal}
        onImportarAnimales={onImportarAnimales}
      />
    </aside>
  );
}
