import { formatFecha } from "@/features/animales/utils/formatDate";
import type { ProgresoFaseServicio } from "../../utils/faseServicio";
import { labelFase } from "../../utils/faseServicio";

type ProgresoProps = {
  mode: "progreso";
  progreso: ProgresoFaseServicio;
  fechaInicio: string;
  fechaFin: string;
};

export type SegmentoBreakdown = {
  label: string;
  cantidad: number;
  pct: number;
  color: string;
};

type BreakdownProps = {
  mode: "breakdown";
  segmentos: SegmentoBreakdown[];
};

export function ServicioFaseBar(props: ProgresoProps | BreakdownProps) {
  if (props.mode === "breakdown") {
    const { segmentos } = props;
    return (
      <div className="servicio-fase-bar">
        <div className="servicio-fase-bar__segmentos servicio-fase-bar__segmentos--breakdown">
          {segmentos.map((s) => (
            <div
              key={s.label}
              className="servicio-fase-bar__segmento"
              style={{ width: `${s.pct}%`, background: s.color }}
              title={`${s.label}: ${s.cantidad}`}>
              {s.pct >= 8 && `${Math.round(s.pct)}%`}
            </div>
          ))}
        </div>
        <div className="servicio-fase-bar__leyenda">
          {segmentos.map((s) => (
            <span key={s.label} className="servicio-fase-bar__leyenda-item">
              <span className="servicio-fase-bar__leyenda-dot" style={{ background: s.color }} />
              <b>{s.label}</b> {s.cantidad}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const { progreso, fechaInicio, fechaFin } = props;
  const progresoPct = (progreso.diaActual / progreso.totalDias) * 100;

  return (
    <div className="servicio-fase-bar">
      <div className="servicio-fase-bar__top">
        <span className="servicio-fase-bar__fase-actual">
          Fase actual: <b>{labelFase(progreso.fase)}</b>
        </span>
        <span className="servicio-fase-bar__dia">
          Día {progreso.diaActual} de {progreso.totalDias}
        </span>
      </div>

      <div className="servicio-fase-bar__contenedor">
        <div className="servicio-fase-bar__segmentos">
          <div
            className="servicio-fase-bar__segmento servicio-fase-bar__segmento--cabeza"
            style={{ width: `${(progreso.finCabeza / progreso.totalDias) * 100}%` }}>
            Cabeza
          </div>
          <div
            className="servicio-fase-bar__segmento servicio-fase-bar__segmento--cuerpo"
            style={{ width: `${((progreso.finCuerpo - progreso.finCabeza) / progreso.totalDias) * 100}%` }}>
            Cuerpo
          </div>
          <div
            className="servicio-fase-bar__segmento servicio-fase-bar__segmento--cola"
            style={{ width: `${((progreso.totalDias - progreso.finCuerpo) / progreso.totalDias) * 100}%` }}>
            Cola
          </div>
        </div>
        <div className="servicio-fase-bar__marcador" style={{ left: `${progresoPct}%` }} />
      </div>

      <div className="servicio-fase-bar__fechas">
        <span>{formatFecha(fechaInicio)}</span>
        <span>{formatFecha(fechaFin)}</span>
      </div>

      <p className="servicio-fase-bar__caption">
        Las preñeces hasta el {formatFecha(progreso.fechaFinCabeza)} cuentan como cabeza. Quedan{" "}
        {progreso.diasRestantes} {progreso.diasRestantes === 1 ? "día" : "días"}.
      </p>
    </div>
  );
}
