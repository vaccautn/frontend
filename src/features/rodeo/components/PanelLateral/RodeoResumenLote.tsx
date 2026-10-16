import {
  colorPorEstadoLote,
  labelPorEstadoLote,
  hexConAlpha,
} from "@/features/mapa/utils/estadoLoteColor";
import type { LotePotreroPropiedades } from "@/features/mapa/types";

type Props = {
  lote: LotePotreroPropiedades;
  criticos: number;
  loadingCriticos: boolean;
};

function formatearNumero(valor: number | null, decimales = 1): string {
  return valor === null ? "—" : valor.toFixed(decimales);
}

export function RodeoResumenLote({ lote, criticos, loadingCriticos }: Props) {
  const colorEstado = colorPorEstadoLote(lote.estado);

  return (
    <div className="rodeo-panel__resumen">
      <span
        className="rodeo-panel__badge"
        style={{ background: hexConAlpha(colorEstado, 0.14), color: colorEstado }}>
        {labelPorEstadoLote(lote.estado)}
      </span>
      <div className="rodeo-panel__lote-nombre">{lote.nombre}</div>
      <div className="rodeo-panel__lote-meta">
        {lote.categoria} · {formatearNumero(lote.superficie_ha)} ha
      </div>
      <div className="rodeo-panel__stats-grid">
        <div className="rodeo-panel__stat">
          <span>Animales</span>
          <strong>{lote.cantidad_animales}</strong>
        </div>
        <div className="rodeo-panel__stat">
          <span>Carga actual</span>
          <strong>
            {formatearNumero(lote.carga_animales_ha, 2)}
            <small> cab/ha</small>
          </strong>
        </div>
        <div className="rodeo-panel__stat">
          <span>CC promedio</span>
          <strong>{formatearNumero(lote.cc_promedio, 2)}</strong>
        </div>
        <div className="rodeo-panel__stat">
          <span>Críticos</span>
          <strong style={{ color: criticos > 0 ? "var(--rojo-alerta)" : undefined }}>
            {loadingCriticos ? "…" : criticos}
          </strong>
        </div>
      </div>
    </div>
  );
}
