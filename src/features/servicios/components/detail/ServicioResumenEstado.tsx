import { Box, Button, Text } from "@chakra-ui/react";
import { IconClipboardCheck } from "@tabler/icons-react";
import { CATEGORIA_ANIMAL_LABELS } from "@/features/animales/constants";
import type { Animal } from "@/features/animales/types";
import { calcularFaseServicio } from "../../utils/faseServicio";
import { ServicioFaseBar, type SegmentoBreakdown } from "./ServicioFaseBar";
import type { ParticipanteServicio, ServicioLotesAgrupados, ServicioRead, ToroServicio } from "../../types";

type Props = {
  servicio: ServicioRead;
  lotes: ServicioLotesAgrupados | null;
  participantes: ParticipanteServicio[];
  toros: ToroServicio[];
  animalesPorLoteId: Map<number, Animal[]>;
  cantidadVacas: number;
  loading: boolean;
  hayResultadosPendientes: boolean;
  onCargarResultados: () => void;
};

function KpiTile({ label, valor, sub }: { label: string; valor: string | number; sub?: string }) {
  return (
    <Box className="servicio-kpi-tile">
      <Text className="servicio-kpi-tile__label">{label}</Text>
      <Text className="servicio-kpi-tile__valor">{valor}</Text>
      {sub && <Text className="servicio-kpi-tile__sub">{sub}</Text>}
    </Box>
  );
}

const SEGS_COLORES: Record<string, string> = {
  Cabeza: "#2f7d4a",
  Cuerpo: "#9cc48a",
  Cola: "#e7c26a",
  Vacía: "#d9827a",
};

export function ServicioResumenEstado({
  servicio,
  lotes,
  participantes,
  toros,
  animalesPorLoteId,
  cantidadVacas,
  loading,
  hayResultadosPendientes,
  onCargarResultados,
}: Props) {
  const enServicio = toros.filter((t) => t.participacion.estado === "EN_SERVICIO").length;
  const repuesto = toros.filter((t) => t.participacion.estado === "REPUESTO").length;

  if (loading) {
    return <p className="status-message">Cargando...</p>;
  }

  if (servicio.estado === "PLANIFICADO") {
    const excluidosPorCategoria = new Map<string, number>();
    for (const lote of lotes?.toros ?? []) {
      for (const animal of animalesPorLoteId.get(lote.id) ?? []) {
        if (animal.estado !== "ACTIVO" || animal.categoria === "TORO") continue;
        excluidosPorCategoria.set(animal.categoria, (excluidosPorCategoria.get(animal.categoria) ?? 0) + 1);
      }
    }
    const totalExcluidos = [...excluidosPorCategoria.values()].reduce((a, b) => a + b, 0);
    const excluidosTexto = [...excluidosPorCategoria.entries()]
      .map(([categoria, n]) => `${n} ${(CATEGORIA_ANIMAL_LABELS[categoria] ?? categoria).toLowerCase()}${n === 1 ? "" : "s"}`)
      .join(" · ");

    return (
      <div className="servicio-kpis">
        <KpiTile label="Vacas" valor={cantidadVacas} sub="todas, de todos los lotes" />
        <KpiTile
          label="Toros en servicio / repuesto"
          valor={`${enServicio} / ${repuesto}`}
          sub="elegí abajo"
        />
        <KpiTile label="Excluidos automáticamente" valor={totalExcluidos} sub={excluidosTexto || "—"} />
      </div>
    );
  }

  if (servicio.estado === "EN_CURSO") {
    const progreso = calcularFaseServicio(servicio.fecha_inicio, servicio.fecha_fin);
    const ratio = enServicio > 0 ? Math.round(cantidadVacas / enServicio) : null;
    return (
      <div className="servicio-resumen-estado">
        {progreso && servicio.fecha_fin && (
          <ServicioFaseBar
            mode="progreso"
            progreso={progreso}
            fechaInicio={servicio.fecha_inicio}
            fechaFin={servicio.fecha_fin}
          />
        )}
        <div className="servicio-kpis">
          <KpiTile
            label="Vacas en servicio"
            valor={cantidadVacas}
            sub={`de ${lotes?.vientres.length ?? 0} ${lotes?.vientres.length === 1 ? "lote" : "lotes"}`}
          />
          <KpiTile
            label="Toros activos"
            valor={enServicio}
            sub={ratio ? `1 toro c/ ${ratio} vacas` : undefined}
          />
          <KpiTile label="Toros de repuesto" valor={repuesto} sub="disponibles para cambio" />
        </div>
      </div>
    );
  }

  const esFinPend =
    servicio.estado === "FINALIZADO" && hayResultadosPendientes;

  if (esFinPend) {
    const dias =
      servicio.fecha_fin && servicio.fecha_inicio
        ? Math.round(
            (new Date(servicio.fecha_fin).getTime() - new Date(servicio.fecha_inicio).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null;
    return (
      <div className="servicio-resumen-estado">
        <div className="servicio-falta-tacto">
          <Text fontSize="1rem" fontWeight="800">
            Falta el tacto
          </Text>
          <Text fontSize="0.85rem" color="var(--text)" maxW="520px">
            El servicio terminó el {servicio.fecha_fin ? servicio.fecha_fin : ""}. Cargá el resultado del tacto de
            cada vaca (cabeza, cuerpo, cola o vacía) para medir el rendimiento y planificar el reservicio de las
            vacías.
          </Text>
          <Button colorPalette="brand" size="sm" onClick={onCargarResultados}>
            <IconClipboardCheck size={16} stroke={1.5} />
            Cargar resultados de tacto
          </Button>
        </div>
        <div className="servicio-kpis">
          <KpiTile label="Vacas" valor={participantes.length} sub="en este servicio" />
          <KpiTile label="Toros usados" valor={enServicio + repuesto} />
          {dias !== null && <KpiTile label="Duración" valor={`${dias} días`} />}
        </div>
      </div>
    );
  }

  // hasRes: FINALIZADO con resultados cargados, o CERRADO.
  const diagnosticados = participantes.filter((p) => p.resultado.estado !== "PENDIENTE");
  if (diagnosticados.length === 0) return null;

  const cabeza = diagnosticados.filter((p) => p.resultado.tipo_prenez === "CABEZA").length;
  const cuerpo = diagnosticados.filter((p) => p.resultado.tipo_prenez === "CUERPO").length;
  const cola = diagnosticados.filter((p) => p.resultado.tipo_prenez === "COLA").length;
  const vacias = diagnosticados.filter((p) => p.resultado.estado === "VACIA").length;
  const total = cabeza + cuerpo + cola + vacias;
  if (total === 0) return null;

  const pregnadas = cabeza + cuerpo + cola;
  const pregPct = Math.round((pregnadas / total) * 100);

  const segmentos: SegmentoBreakdown[] = [
    { label: "Cabeza", cantidad: cabeza, pct: (cabeza / total) * 100, color: SEGS_COLORES.Cabeza },
    { label: "Cuerpo", cantidad: cuerpo, pct: (cuerpo / total) * 100, color: SEGS_COLORES.Cuerpo },
    { label: "Cola", cantidad: cola, pct: (cola / total) * 100, color: SEGS_COLORES.Cola },
    { label: "Vacía", cantidad: vacias, pct: (vacias / total) * 100, color: SEGS_COLORES.Vacía },
  ].filter((s) => s.cantidad > 0);

  return (
    <div className="servicio-resumen-estado">
      <div className="servicio-preñez-total">
        <div className="servicio-preñez-total__pct">
          <Text fontSize="0.75rem" color="var(--text)">
            Preñez total
          </Text>
          <Text fontSize="2.75rem" fontWeight="800" color="var(--verde-confirmacion)" lineHeight="1.1">
            {pregPct}%
          </Text>
          <Text fontSize="0.75rem" color="var(--text)">
            {pregnadas} de {total} vacas
          </Text>
        </div>
        <ServicioFaseBar mode="breakdown" segmentos={segmentos} />
      </div>
      {vacias > 0 && (
        <p className="servicio-vacias-nota">
          <b>{vacias}</b> {vacias === 1 ? "vaca vacía" : "vacas vacías"} · quedan secas
          {servicio.estado === "FINALIZADO" && servicio.servicio_origen_id === null && " y pasan a reservicio"}
        </p>
      )}
    </div>
  );
}
