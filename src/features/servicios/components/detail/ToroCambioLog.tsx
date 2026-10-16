import { formatEventDate } from "@/utils/localDateTime";
import type { ToroServicio } from "../../types";

export function ToroCambioLog({ toros }: { toros: ToroServicio[] }) {
  const porAnimalId = new Map(toros.map((t) => [t.animal.id, t.animal]));
  const bajas = toros
    .filter((t) => t.participacion.estado === "BAJA" && t.participacion.fecha_cambio)
    .sort((a, b) => (b.participacion.fecha_cambio ?? "").localeCompare(a.participacion.fecha_cambio ?? ""));

  if (bajas.length === 0) return null;

  return (
    <div className="toro-cambio-log">
      {bajas.map((t) => {
        const repuesto = t.participacion.reemplazado_por_animal_id
          ? porAnimalId.get(t.participacion.reemplazado_por_animal_id)
          : null;
        return (
          <p key={t.participacion.id} className="toro-cambio-log__item">
            ↺ {formatEventDate(t.participacion.fecha_cambio ?? "")} ·{" "}
            {t.animal.caravana ?? `#${t.animal.id}`} reemplazado por{" "}
            {repuesto ? (repuesto.caravana ?? `#${repuesto.id}`) : "—"}
            {t.participacion.motivo && ` — ${t.participacion.motivo}`}
          </p>
        );
      })}
    </div>
  );
}
