import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type TransitionEvent,
} from "react";
import { Portal, Tooltip } from "@chakra-ui/react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import type {
  TimelinePeriod,
  TimelineProps,
  TimelineStatus,
} from "./Timeline.types";
import {
  calcularPosicionHoy,
  calcularPosicionPeriodo,
  esFechaValida,
  generarColumnasTiempo,
  limitesDelAnio,
  periodoEnRango,
  type ColumnaTiempo,
} from "./timeline.utils";
import "./timeline.css";

const ESTADOS_LEYENDA: { status: TimelineStatus; label: string }[] = [
  { status: "planned", label: "Planificado" },
  { status: "in_progress", label: "En curso" },
  { status: "completed", label: "Finalizado" },
  { status: "closed", label: "Cerrado" },
];

const LABEL_POR_ESTADO: Record<TimelineStatus, string> = {
  planned: "Planificado",
  in_progress: "En curso",
  completed: "Finalizado",
  closed: "Cerrado",
};

/** Duración de la animación al cambiar de año, por flecha o por arrastre. */
const DURACION_TRANSICION_MS = 280;

/** Fracción del ancho visible que hay que arrastrar para confirmar el cambio
 * de año; por debajo de esto, el arrastre vuelve a su posición original. */
const UMBRAL_ARRASTRE_PCT = 0.18;

/** Movimiento mínimo (px) para considerar que hubo arrastre y no un click. */
const UMBRAL_CLICK_PX = 4;

interface PanelData {
  columnas: ColumnaTiempo[];
  periodosVisibles: TimelinePeriod[];
  posicionesPorId: Map<string, { left: number; width: number }>;
  hoyPct: number | null;
}

function calcularPanel(
  anio: number,
  periods: TimelinePeriod[],
  today: Date,
): PanelData {
  const limites = limitesDelAnio(anio);
  const columnas = generarColumnasTiempo(limites);
  const periodosVisibles = periods.filter((period) =>
    periodoEnRango(period, limites),
  );

  const posicionesPorId = new Map<string, { left: number; width: number }>();
  for (const period of periodosVisibles) {
    const pos = calcularPosicionPeriodo(period, limites);
    if (pos) posicionesPorId.set(period.id, pos);
  }

  return {
    columnas,
    periodosVisibles,
    posicionesPorId,
    hoyPct: calcularPosicionHoy(today, limites),
  };
}

function prefiereMovimientoReducido(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

type TimelineYearPanelProps = {
  data: PanelData;
  activo: boolean;
  showToday: boolean;
  selectedId: string | undefined;
  onPeriodClick: ((id: string) => void) | undefined;
};

function TimelineYearPanel({
  data,
  activo,
  showToday,
  selectedId,
  onPeriodClick,
}: TimelineYearPanelProps) {
  return (
    <div className="timeline__panel" aria-hidden={!activo || undefined}>
      <div
        className="timeline__escala"
        style={{ gridTemplateColumns: `repeat(${data.columnas.length}, 1fr)` }}>
        {data.columnas.map((col) => (
          <div
            key={col.key}
            className="timeline__columna"
            data-inicio-anio={col.esInicioAnio}>
            <span className="timeline__anio">{col.anioLabel}</span>
            <span className="timeline__mes">{col.mesLabel}</span>
          </div>
        ))}
      </div>

      <div className="timeline__carriles">
        {data.periodosVisibles.map((period, index) => {
          const pos = data.posicionesPorId.get(period.id);
          if (!pos) return null;

          const interactiva = activo && Boolean(onPeriodClick);
          const handleClick = interactiva
            ? () => onPeriodClick?.(period.id)
            : undefined;

          return (
            <Tooltip.Root key={period.id} openDelay={100} positioning={{ placement: "top" }}>
              <Tooltip.Trigger asChild>
                <div
                  className="timeline__barra"
                  data-status={period.status}
                  data-seleccionado={activo && period.id === selectedId}
                  data-interactiva={interactiva}
                  role={interactiva ? "button" : undefined}
                  tabIndex={interactiva ? 0 : -1}
                  aria-label={`${period.name}: ${LABEL_POR_ESTADO[period.status]}`}
                  data-period-id={period.id}
                  style={{
                    left: `${pos.left}%`,
                    width: `${pos.width}%`,
                    top: 0,
                    zIndex: index + 1,
                  }}
                  onKeyDown={
                    interactiva
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleClick?.();
                          }
                        }
                      : undefined
                  }>
                  <span className="timeline__barra-texto">{period.name}</span>
                </div>
              </Tooltip.Trigger>
              <Portal>
                <Tooltip.Positioner>
                  <Tooltip.Content className="timeline__barra-tooltip">
                    {period.name}
                  </Tooltip.Content>
                </Tooltip.Positioner>
              </Portal>
            </Tooltip.Root>
          );
        })}
      </div>

      {showToday && data.hoyPct !== null && (
        <div
          className="timeline__hoy"
          style={{ left: `${data.hoyPct}%` }}></div>
      )}
    </div>
  );
}

export function Timeline({
  periods,
  currentDate,
  showToday = true,
  showLegend = true,
  className,
  onPeriodClick,
  selectedId,
}: TimelineProps) {
  const today = useMemo(() => currentDate ?? new Date(), [currentDate]);

  const [anio, setAnio] = useState(() => today.getFullYear());

  const paneles = useMemo(
    () =>
      [anio - 1, anio, anio + 1].map((a) => calcularPanel(a, periods, today)),
    [anio, periods, today],
  );

  const areaRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    movido: boolean;
    periodId?: string;
  } | null>(null);
  const draggedRef = useRef(false);
  const alTerminarRef = useRef<(() => void) | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const offsetPxRef = useRef(0);

  const [offsetPx, setOffsetPxState] = useState(0);
  const [animando, setAnimando] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);

  function setOffsetPx(valor: number) {
    offsetPxRef.current = valor;
    setOffsetPxState(valor);
  }

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  /** Cierra la transición en curso (la haya terminado el navegador con
   * `transitionend` o no) y ejecuta el callback pendiente una sola vez. Un
   * timeout de seguridad la cierra igual si `transitionend` no llega a
   * disparar (puede pasar si el valor de destino ya era el actual). */
  function finalizarTransicion() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setAnimando(false);
    const alTerminar = alTerminarRef.current;
    alTerminarRef.current = null;
    alTerminar?.();
  }

  /** Anima el track hasta `offsetDestino` y ejecuta `alTerminar` al llegar
   * (instantáneo, sin animación, si el usuario prefiere movimiento reducido
   * o si ya está en ese destino). */
  function moverA(offsetDestino: number, alTerminar: () => void) {
    if (prefiereMovimientoReducido() || offsetDestino === offsetPxRef.current) {
      setOffsetPx(offsetDestino);
      alTerminar();
      return;
    }
    alTerminarRef.current = alTerminar;
    setAnimando(true);
    setOffsetPx(offsetDestino);
    timeoutRef.current = window.setTimeout(
      finalizarTransicion,
      DURACION_TRANSICION_MS + 80,
    );
  }

  function irA(direccion: 1 | -1) {
    if (animando || arrastrando) return;
    const ancho = areaRef.current?.getBoundingClientRect().width ?? 0;
    moverA(-direccion * ancho, () => {
      setAnio((a) => a + direccion);
      setOffsetPx(0);
    });
  }

  /** Lleva la escala a `anioDestino`: si es el año adyacente usa la misma
   * animación de deslizamiento que las flechas; si está más lejos (varios
   * años de distancia) no hay carril intermedio para animar, así que salta
   * directo. */
  function irAAnio(anioDestino: number) {
    if (animando || arrastrando) return;
    const diferencia = anioDestino - anio;
    if (diferencia === 0) return;
    if (diferencia === 1 || diferencia === -1) {
      irA(diferencia);
      return;
    }
    setAnio(anioDestino);
  }

  // Cuando el período seleccionado queda fuera del año visible (por ejemplo,
  // lo eligieron desde la lista y empieza el año que viene), movemos la
  // escala para que vuelva a quedar a la vista. No depende de `anio`: una
  // vez hecho el salto, la navegación manual posterior no se pelea con esto.
  useEffect(() => {
    if (!selectedId) return;
    const period = periods.find((p) => p.id === selectedId);
    if (!period || !esFechaValida(period.startDate)) return;
    if (periodoEnRango(period, limitesDelAnio(anio))) return;
    irAAnio(period.startDate.getFullYear());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, periods]);

  function onTrackTransitionEnd(event: TransitionEvent<HTMLDivElement>) {
    if (
      event.target !== event.currentTarget ||
      event.propertyName !== "transform"
    )
      return;
    finalizarTransicion();
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (animando) return;
    // Si el navegador no reconoce el puntero como activo (puede pasar con
    // algunas herramientas de automatización), seguimos igual: la captura
    // solo mejora el arrastre cuando el cursor sale del elemento.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* noop */
    }
    // El click de una barra se resuelve a mano (ver soltarArrastre) en vez
    // de depender del evento "click" nativo del navegador: una vez que el
    // track captura el puntero para poder arrastrar la línea de tiempo, el
    // click sintetizado por el navegador deja de ser confiable (puede no
    // llegar a la barra). Por eso guardamos acá qué barra empezó el gesto.
    const barraId = (event.target as HTMLElement)
      .closest<HTMLElement>('.timeline__barra[data-interactiva="true"]')
      ?.dataset.periodId;
    dragRef.current = { startX: event.clientX, movido: false, periodId: barraId };
    draggedRef.current = false;
    setArrastrando(true);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const delta = event.clientX - dragRef.current.startX;
    if (Math.abs(delta) > UMBRAL_CLICK_PX) dragRef.current.movido = true;
    const ancho = areaRef.current?.getBoundingClientRect().width ?? 1;
    setOffsetPx(Math.max(-ancho, Math.min(ancho, delta)));
  }

  function soltarArrastre() {
    if (!dragRef.current) return;
    const { movido, periodId } = dragRef.current;
    draggedRef.current = movido;
    const delta = offsetPx;
    const ancho = areaRef.current?.getBoundingClientRect().width ?? 1;
    const pasaElUmbral = Math.abs(delta) > ancho * UMBRAL_ARRASTRE_PCT;
    dragRef.current = null;
    setArrastrando(false);

    // El gesto terminó donde empezó (sin arrastre real): si arrancó sobre
    // una barra interactiva, eso es un click.
    if (!movido && periodId) {
      handlePeriodClick?.(periodId);
    }

    if (!pasaElUmbral) {
      moverA(0, () => {});
      return;
    }
    const direccion: 1 | -1 = delta < 0 ? 1 : -1;
    moverA(Math.sign(delta) * ancho, () => {
      setAnio((a) => a + direccion);
      setOffsetPx(0);
    });
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* noop */
    }
    soltarArrastre();
  }

  function onPointerCancel() {
    soltarArrastre();
  }

  const handlePeriodClick = onPeriodClick
    ? (id: string) => {
        if (draggedRef.current) return;
        onPeriodClick(id);
      }
    : undefined;

  return (
    <div className={`timeline${className ? ` ${className}` : ""}`}>
      <header className="timeline__header">
        <span className="timeline__titulo">Línea de tiempo</span>
        {showLegend && (
          <div className="timeline__leyenda">
            {ESTADOS_LEYENDA.map(({ status, label }) => (
              <span key={status} className="timeline__leyenda-item">
                <span className="timeline__leyenda-dot" data-status={status} />
                {label}
              </span>
            ))}
          </div>
        )}
      </header>

      {periods.length === 0 ? (
        <p className="timeline__vacio">No hay períodos para mostrar.</p>
      ) : (
        <div className="timeline__paginador">
          <button
            type="button"
            className="timeline__nav"
            aria-label="Año anterior"
            onClick={() => irA(-1)}>
            <IconChevronLeft size={16} stroke={2} />
          </button>

          <div className="timeline__area" ref={areaRef}>
            <div
              className="timeline__track"
              data-arrastrando={arrastrando}
              style={{
                transform: `translateX(calc(-33.3333% + ${offsetPx}px))`,
                transition: animando
                  ? `transform ${DURACION_TRANSICION_MS}ms ease`
                  : "none",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
              onTransitionEnd={onTrackTransitionEnd}>
              <TimelineYearPanel
                data={paneles[0]}
                activo={false}
                showToday={showToday}
                selectedId={selectedId}
                onPeriodClick={undefined}
              />
              <TimelineYearPanel
                data={paneles[1]}
                activo
                showToday={showToday}
                selectedId={selectedId}
                onPeriodClick={handlePeriodClick}
              />
              <TimelineYearPanel
                data={paneles[2]}
                activo={false}
                showToday={showToday}
                selectedId={selectedId}
                onPeriodClick={undefined}
              />
            </div>
          </div>

          <button
            type="button"
            className="timeline__nav"
            aria-label="Año siguiente"
            onClick={() => irA(1)}>
            <IconChevronRight size={16} stroke={2} />
          </button>
        </div>
      )}
    </div>
  );
}

export type { TimelinePeriod, TimelineProps, TimelineStatus };
