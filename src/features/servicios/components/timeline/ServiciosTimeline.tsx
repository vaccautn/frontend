import { useMemo } from "react";
import { Timeline } from "@/components/ui/Timeline/Timeline";
import type { ServicioRead } from "../../types";
import { serviciosATimelinePeriods } from "../../utils/servicioTimelineAdapter";

type Props = {
  servicios: ServicioRead[];
  seleccionadoId: number | null;
  onSelect: (id: number) => void;
};

export function ServiciosTimeline({ servicios, seleccionadoId, onSelect }: Props) {
  const periods = useMemo(() => serviciosATimelinePeriods(servicios), [servicios]);

  return (
    <Timeline
      periods={periods}
      selectedId={seleccionadoId !== null ? String(seleccionadoId) : undefined}
      onPeriodClick={(id) => onSelect(Number(id))}
    />
  );
}
