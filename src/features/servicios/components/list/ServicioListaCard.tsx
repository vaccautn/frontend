import { formatFecha } from "@/features/animales/utils/formatDate";
import type { PendientesServicio } from "../../utils/servicioEstado";
import { calcularFaseServicio, labelFase } from "../../utils/faseServicio";
import { ESTADO_SERVICIO_LABELS } from "../../constants";
import type { ResultadoServicioRead, ServicioRead } from "../../types";

type Props = {
  servicio: ServicioRead;
  seleccionado: boolean;
  pendiente: PendientesServicio | undefined;
  resultados: ResultadoServicioRead[];
  onClick: () => void;
};

function diasHasta(fechaIso: string): number {
  const [y, m, d] = fechaIso.split("-").map(Number);
  const objetivo = new Date(y, m - 1, d);
  const hoy = new Date();
  const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((objetivo.getTime() - hoySinHora.getTime()) / (1000 * 60 * 60 * 24));
}

function subtitulo(servicio: ServicioRead, resultados: ResultadoServicioRead[]): string {
  if (servicio.estado === "PLANIFICADO") {
    const dias = diasHasta(servicio.fecha_inicio);
    return dias <= 0 ? "Comienza hoy" : `Comienza en ${dias} ${dias === 1 ? "día" : "días"}`;
  }

  if (servicio.estado === "EN_CURSO") {
    const fase = calcularFaseServicio(servicio.fecha_inicio, servicio.fecha_fin);
    if (fase) return `Día ${fase.diaActual} de ${fase.totalDias} · fase ${labelFase(fase.fase).toLowerCase()}`;
  }

  const diagnosticados = resultados.filter((r) => r.estado !== "PENDIENTE");
  if (diagnosticados.length > 0) {
    const total = diagnosticados.length;
    const prenadas = diagnosticados.filter((r) => r.estado === "PRENADA").length;
    const cabeza = diagnosticados.filter((r) => r.tipo_prenez === "CABEZA").length;
    const pct = (n: number) => `${Math.round((n / total) * 100)}%`;
    return `Preñez ${pct(prenadas)} · Cabeza ${pct(cabeza)}`;
  }

  return "";
}

export function ServicioListaCard({ servicio, seleccionado, pendiente, resultados, onClick }: Props) {
  const fase = servicio.estado === "EN_CURSO" ? calcularFaseServicio(servicio.fecha_inicio, servicio.fecha_fin) : null;
  const progresoPct = fase ? Math.round((fase.diaActual / fase.totalDias) * 100) : null;

  return (
    <div
      role="button"
      tabIndex={0}
      className="servicio-lista-card"
      data-seleccionado={seleccionado}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}>
      <div className="servicio-lista-card__top">
        <span className="servicio-lista-card__nombre">{servicio.nombre}</span>
        <span className={`servicio-badge servicio-badge--${servicio.estado}`}>
          {ESTADO_SERVICIO_LABELS[servicio.estado]}
        </span>
      </div>

      <div className="servicio-lista-card__fechas">
        {formatFecha(servicio.fecha_inicio)} – {servicio.fecha_fin ? formatFecha(servicio.fecha_fin) : "—"}
      </div>

      <div className="servicio-lista-card__sub">
        {progresoPct !== null && (
          <div className="servicio-lista-card__progreso">
            <div className="servicio-lista-card__progreso-rellena" style={{ width: `${progresoPct}%` }} />
          </div>
        )}
        {pendiente?.resultados && (
          <span className="servicio-alerta">Resultados por cargar</span>
        )}
        <span>{subtitulo(servicio, resultados)}</span>
      </div>
    </div>
  );
}
