import { useEffect, useMemo, useState } from "react";
import { getResultadosServicio, getServicios } from "../../services/serviciosService";
import { construirHistorialPorAnimal, calcularTendencia, labelTendencia, type HistorialPunto } from "../../utils/historialVaca";
import { ESTADO_RESULTADO_SERVICIO_LABELS, TIPO_PRENEZ_LABELS } from "../../constants";
import type { ParticipanteServicio, TipoPrenez } from "../../types";

type Filtro = "TODAS" | TipoPrenez | "VACIA";

const CHIPS: { value: Filtro; label: string }[] = [
  { value: "TODAS", label: "Todas" },
  { value: "CABEZA", label: "Cabeza" },
  { value: "CUERPO", label: "Cuerpo" },
  { value: "COLA", label: "Cola" },
  { value: "VACIA", label: "Vacías" },
];

const ABREV: Record<string, string> = { CABEZA: "Cab", CUERPO: "Cue", COLA: "Col" };

function abreviarPunto(punto: HistorialPunto): string {
  if (punto.resultado.estado === "VACIA") return "Vac";
  if (punto.resultado.tipo_prenez) return ABREV[punto.resultado.tipo_prenez] ?? "—";
  return "—";
}

function tituloPunto(punto: HistorialPunto): string {
  const nombre = punto.servicio.nombre || `Servicio #${punto.servicio.id}`;
  if (punto.resultado.estado === "VACIA") return `${nombre}: Vacía`;
  if (punto.resultado.tipo_prenez) return `${nombre}: ${TIPO_PRENEZ_LABELS[punto.resultado.tipo_prenez]}`;
  return `${nombre}: ${ESTADO_RESULTADO_SERVICIO_LABELS[punto.resultado.estado] ?? punto.resultado.estado}`;
}

/** "Preñez X% · Cabeza Y%" para un grupo de participantes (resumen por lote). */
function resumenGrupo(participantes: ParticipanteServicio[]): string {
  const total = participantes.length;
  if (total === 0) return "";
  const pct = (n: number) => `${Math.round((n / total) * 100)}%`;
  const prenadas = participantes.filter(
    (p) => p.resultado.estado === "PRENADA" || p.resultado.estado === "PARIDA",
  ).length;
  const cabeza = participantes.filter((p) => p.resultado.tipo_prenez === "CABEZA").length;
  return `Preñez ${pct(prenadas)} · Cabeza ${pct(cabeza)}`;
}

export function ServicioHistorialPorVaca({ participantes }: { participantes: ParticipanteServicio[] }) {
  const [historialPorAnimal, setHistorialPorAnimal] = useState<Map<number, HistorialPunto[]>>(new Map());
  const [filtro, setFiltro] = useState<Filtro>("TODAS");
  const [agruparPorLote, setAgruparPorLote] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getResultadosServicio(), getServicios()])
      .then(([resultados, servicios]) => {
        if (cancelled) return;
        setHistorialPorAnimal(construirHistorialPorAnimal(resultados, servicios));
      })
      .catch(() => {
        /* la tabla principal ya muestra el resultado actual; el historial es un extra */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtrados = useMemo(
    () =>
      participantes.filter((p) => {
        if (filtro === "TODAS") return true;
        if (filtro === "VACIA") return p.resultado.estado === "VACIA";
        return p.resultado.tipo_prenez === filtro;
      }),
    [participantes, filtro],
  );

  const grupos = useMemo(() => {
    if (!agruparPorLote) return null;
    const mapa = new Map<string, ParticipanteServicio[]>();
    for (const p of filtrados) {
      const key = p.lote_actual?.nombre ?? "Sin lote";
      const lista = mapa.get(key) ?? [];
      lista.push(p);
      mapa.set(key, lista);
    }
    return [...mapa.entries()];
  }, [filtrados, agruparPorLote]);

  const renderFila = (p: ParticipanteServicio) => {
    const historial = historialPorAnimal.get(p.animal.id) ?? [];
    const tendencia = calcularTendencia(historial);
    return (
      <div key={p.resultado.id} className="servicio-historial__fila">
        <span>{p.animal.caravana ?? `#${p.animal.id}`}</span>
        <span className="servicio-historial__lote">{p.lote_actual?.nombre ?? "—"}</span>
        <span className={`resultado-badge resultado-badge--${p.resultado.estado}`}>
          {ESTADO_RESULTADO_SERVICIO_LABELS[p.resultado.estado] ?? p.resultado.estado}
        </span>
        <span className="servicio-historial__puntos">
          {historial.map((punto) => (
            <span
              key={punto.resultado.id}
              title={tituloPunto(punto)}
              className="servicio-historial__punto"
              data-estado={punto.resultado.estado}>
              {abreviarPunto(punto)}
            </span>
          ))}
        </span>
        <span className="servicio-historial__tendencia" data-tendencia={tendencia ?? undefined}>
          {tendencia ? labelTendencia(tendencia) : "—"}
        </span>
      </div>
    );
  };

  return (
    <section className="animal-detail__section">
      <div className="animal-detail__section-header">
        <div>
          <span className="animal-detail__section-eyebrow">Por vaca</span>
          <h2>Resultado e historial</h2>
        </div>
        <div className="servicio-historial__controles">
          <button
            type="button"
            className="servicio-historial__agrupar"
            data-activo={agruparPorLote}
            aria-pressed={agruparPorLote}
            onClick={() => setAgruparPorLote((v) => !v)}>
            <span className="servicio-historial__agrupar-knob" />
            Agrupar por lote
          </button>
          <div className="servicio-historial__chips">
            {CHIPS.map((c) => (
              <button
                key={c.value}
                type="button"
                data-activo={filtro === c.value}
                onClick={() => setFiltro(c.value)}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="servicio-historial__tabla">
        <div className="servicio-historial__header">
          <span>Caravana</span>
          <span>Lote</span>
          <span>Resultado</span>
          <span>Últimos servicios</span>
          <span>Tendencia</span>
        </div>
        {filtrados.length === 0 && <p className="servicio-detail__lotes-vacio">No hay vacas con este filtro.</p>}
        {grupos
          ? grupos.map(([lote, participantesDelLote]) => (
              <div key={lote} className="servicio-historial__grupo">
                <div className="servicio-historial__grupo-header">
                  <span className="servicio-historial__grupo-nombre">
                    {lote} <span className="servicio-historial__grupo-cantidad">· {participantesDelLote.length} vacas</span>
                  </span>
                  <span className="servicio-historial__grupo-resumen">{resumenGrupo(participantesDelLote)}</span>
                </div>
                {participantesDelLote.map(renderFila)}
              </div>
            ))
          : filtrados.map(renderFila)}
      </div>
    </section>
  );
}
