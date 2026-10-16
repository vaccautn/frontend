import type { EstadoParticipacionToro } from "../../types";

const LABELS: Record<EstadoParticipacionToro, string> = {
  EN_SERVICIO: "En servicio",
  REPUESTO: "Repuesto",
  BAJA: "Lesionado · fuera",
};

export function ToroRolBadge({ estado }: { estado: EstadoParticipacionToro }) {
  return <span className={`toro-rol-badge toro-rol-badge--${estado}`}>{LABELS[estado]}</span>;
}
