import { useRef } from "react";
import { IconArrowsMaximize } from "@tabler/icons-react";
import { useMapaCapas } from "@/features/mapa/hooks/useMapaCapas";
import type { LotePotreroFeature } from "@/features/mapa/types";

type Props = {
  features: LotePotreroFeature[];
  loteSeleccionadoId: number | null;
  onLoteClick: (loteId: number) => void;
  onAbrirMapa: () => void;
};

const FIT_PADDING: [number, number, number, number] = [20, 20, 20, 20];

export function RodeoMinimapa({ features, loteSeleccionadoId, onLoteClick, onAbrirMapa }: Props) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);

  useMapaCapas({
    mapDivRef,
    features,
    interactivo: true,
    onLoteClick,
    loteSeleccionadoId,
    fitPadding: FIT_PADDING,
  });

  return (
    <div className="rodeo-minimapa">
      <div ref={mapDivRef} className="rodeo-minimapa__mapa" />
      <div className="rodeo-minimapa__pill">Filtrar por lote</div>
      <button type="button" className="rodeo-minimapa__abrir" onClick={onAbrirMapa}>
        <IconArrowsMaximize size={14} stroke={1.75} />
        Abrir mapa
      </button>
    </div>
  );
}
