export type TimelineStatus = "planned" | "in_progress" | "completed" | "closed";

export interface TimelinePeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: TimelineStatus;
}

export interface TimelineProps {
  periods: TimelinePeriod[];
  /** Fecha usada para el indicador "HOY". Por defecto, la fecha actual. */
  currentDate?: Date;
  /** Límite inferior de la escala. Si no viene, se calcula a partir de `periods`. */
  startDate?: Date;
  /** Límite superior de la escala. Si no viene, se calcula a partir de `periods`. */
  endDate?: Date;
  showToday?: boolean;
  showLegend?: boolean;
  className?: string;
  /** Click en una barra. Si no se pasa, las barras no son interactivas. */
  onPeriodClick?: (id: string) => void;
  /** Id del período resaltado (selección controlada por el padre). */
  selectedId?: string;
}
