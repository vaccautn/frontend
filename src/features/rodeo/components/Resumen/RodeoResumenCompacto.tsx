import {
  colorPorEstadoLote,
  labelPorEstadoLote,
  hexConAlpha,
} from "@/features/mapa/utils/estadoLoteColor";
import { CATEGORIA_ANIMAL_LABELS } from "@/features/animales/constants";
import type { LotePotreroPropiedades } from "@/features/mapa/types";
import type { DashboardAnimalesData } from "@/features/animales/types";

type Props = {
  lote: LotePotreroPropiedades | null;
  totalLotes: number;
  totalHa: number;
  dashboard: DashboardAnimalesData | null;
  loadingDashboard: boolean;
  vacasPrenadas: number;
  loadingVacasPrenadas: boolean;
};

function formatearNumero(valor: number | null | undefined, decimales = 1): string {
  return valor === null || valor === undefined ? "—" : valor.toFixed(decimales);
}

export function RodeoResumenCompacto({
  lote,
  totalLotes,
  totalHa,
  dashboard,
  loadingDashboard,
  vacasPrenadas,
  loadingVacasPrenadas,
}: Props) {
  const total = dashboard?.total_animales_activos ?? 0;
  const evaluados = dashboard?.total_animales_evaluados ?? 0;
  const criticos = dashboard?.alertas.length ?? 0;
  const pctEvaluados = total > 0 ? Math.round((evaluados / total) * 100) : 0;
  const colorEstado = lote ? colorPorEstadoLote(lote.estado) : null;

  return (
    <div className="rodeo-dashboard-full__card rodeo-dashboard-full__resumen">
      <div className="rodeo-dashboard-full__resumen-top">
        <div>
          <div className="rodeo-dashboard-full__resumen-titulo">
            {lote ? lote.nombre : "Todo el rodeo"}
          </div>
          <div className="rodeo-dashboard-full__resumen-subtitulo">
            {lote
              ? `${CATEGORIA_ANIMAL_LABELS[lote.categoria] ?? lote.categoria} · ${formatearNumero(lote.superficie_ha)} ha`
              : `${totalLotes} ${totalLotes === 1 ? "lote" : "lotes"} · ${formatearNumero(totalHa)} ha`}
          </div>
        </div>
        {lote && colorEstado && (
          <span
            className="rodeo-panel__badge"
            style={{ background: hexConAlpha(colorEstado, 0.14), color: colorEstado }}>
            {labelPorEstadoLote(lote.estado)}
          </span>
        )}
      </div>

      <div className="rodeo-dashboard-full__resumen-stats">
        <div className="rodeo-panel__stat">
          <span>Críticos</span>
          <strong style={{ color: criticos > 0 ? "var(--rojo-alerta)" : undefined }}>
            {loadingDashboard ? "…" : criticos}
          </strong>
        </div>
        <div className="rodeo-panel__stat">
          <span>Evaluados</span>
          <strong>{loadingDashboard ? "…" : `${pctEvaluados}%`}</strong>
        </div>
        <div className="rodeo-panel__stat">
          <span>Preñadas</span>
          <strong>{loadingVacasPrenadas ? "…" : vacasPrenadas}</strong>
        </div>
      </div>

      <div className="rodeo-dashboard-full__resumen-footer">
        {loadingDashboard
          ? "Cargando…"
          : `${evaluados} de ${total} animales activos · CC prom. `}
        {!loadingDashboard && <b>{formatearNumero(dashboard?.promedio_actual, 2)}</b>}
      </div>
    </div>
  );
}
