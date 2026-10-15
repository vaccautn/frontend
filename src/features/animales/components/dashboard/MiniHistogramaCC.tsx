import type { HistogramaBin } from "@/features/animales/types";
import { CC_COLORS } from "@/features/animales/utils/ccColor";

type Props = {
  histograma: HistogramaBin[];
};

const ALTURA_MAX_PX = 56;

export function MiniHistogramaCC({ histograma }: Props) {
  const maxCantidad = Math.max(...histograma.map((b) => b.cantidad), 1);

  return (
    <div className="rodeo-mini-histograma">
      {histograma.map((bin) => (
        <div key={bin.valor_cc} className="rodeo-mini-histograma__columna">
          <div
            className="rodeo-mini-histograma__barra"
            style={{
              height: `${Math.max(3, (bin.cantidad / maxCantidad) * ALTURA_MAX_PX)}px`,
              background: CC_COLORS[bin.valor_cc] ?? "#b8c4cc",
            }}
          />
          <span className="rodeo-mini-histograma__label">
            CC {bin.valor_cc} · {bin.cantidad}
          </span>
        </div>
      ))}
    </div>
  );
}
