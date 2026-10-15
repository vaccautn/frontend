import type { DashboardAnimalesData } from "@/features/animales/types";
import { useVacasPrenadas } from "@/features/animales/hooks/useVacasPrenadas";
import { KpiCriticos } from "@/features/animales/components/dashboard/KpiCriticos";
import { KpiEvaluados } from "@/features/animales/components/dashboard/KpiEvaluados";
import { KpiVacasPrenadas } from "@/features/animales/components/dashboard/KpiVacasPrenadas";

type Props = {
  totalLotes: number;
  data: DashboardAnimalesData | null;
  loading: boolean;
};

export function RodeoResumenGeneral({ totalLotes, data, loading }: Props) {
  const { count: vacasPrenadas, loading: loadingVacasPrenadas } = useVacasPrenadas(null);

  return (
    <div className="rodeo-panel__resumen">
      <div className="rodeo-panel__resumen-titulo">Rodeo completo</div>
      <div className="rodeo-panel__resumen-subtitulo">
        {totalLotes} {totalLotes === 1 ? "lote" : "lotes"} · elegí uno en el mapa para filtrar
      </div>
      <div className="rodeo-panel__kpis-generales">
        <KpiCriticos count={data?.alertas.length ?? 0} loading={loading} />
        <KpiEvaluados
          total={data?.total_animales_activos ?? 0}
          evaluados={data?.total_animales_evaluados ?? 0}
          loading={loading}
        />
        <KpiVacasPrenadas count={vacasPrenadas} loading={loadingVacasPrenadas} />
      </div>
    </div>
  );
}
