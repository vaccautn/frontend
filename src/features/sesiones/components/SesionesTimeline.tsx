import { useEffect, useMemo, useRef } from "react";
import { IconPointer } from "@tabler/icons-react";
import type { SesionCapturaConResumen } from "@/features/sesiones/types";

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

// Diámetro del círculo según la cantidad de evaluaciones (escala por raíz
// cuadrada: el área es proporcional a la cantidad).
const DIAMETRO_MIN = 34;
const DIAMETRO_MAX = 64;

type Props = {
  sesiones: SesionCapturaConResumen[];
  seleccionadaId: number | null;
  onSeleccionar: (sesion: SesionCapturaConResumen) => void;
};

/** Línea de tiempo de sesiones agrupadas por año. Cada círculo es una
 * sesión; su tamaño refleja la cantidad de evaluaciones. */
export function SesionesTimeline({ sesiones, seleccionadaId, onSeleccionar }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const anios = useMemo(() => {
    const ordenadas = [...sesiones].sort((a, b) =>
      a.fecha_inicio.localeCompare(b.fecha_inicio),
    );
    const porAnio = new Map<string, SesionCapturaConResumen[]>();
    for (const sesion of ordenadas) {
      const anio = sesion.fecha_inicio.slice(0, 4);
      porAnio.set(anio, [...(porAnio.get(anio) ?? []), sesion]);
    }
    return [...porAnio.entries()];
  }, [sesiones]);

  const maxCount = Math.max(1, ...sesiones.map((s) => s.evaluaciones_count));
  const diametro = (count: number) =>
    DIAMETRO_MIN +
    (DIAMETRO_MAX - DIAMETRO_MIN) * Math.sqrt(count / maxCount);

  // Lo más reciente queda a la derecha: se arranca mostrando ese extremo.
  useEffect(() => {
    const scroll = scrollRef.current;
    if (scroll) scroll.scrollLeft = scroll.scrollWidth;
  }, [anios]);

  return (
    <div className="sesiones-timeline">
      <p className="sesiones-timeline__leyenda">
        <IconPointer size={16} stroke={1.5} />
        Hacé click en una sesión para ver sus detalles. El tamaño del círculo
        indica la cantidad de evaluaciones.
      </p>
      <div className="sesiones-timeline__scroll" ref={scrollRef}>
        <div className="sesiones-timeline__anios">
          {anios.map(([anio, sesionesDelAnio]) => (
            <div key={anio} className="sesiones-timeline__anio">
              <div className="sesiones-timeline__items">
                {sesionesDelAnio.map((sesion) => {
                  const d = diametro(sesion.evaluaciones_count);
                  const dia = Number(sesion.fecha_inicio.slice(8, 10));
                  const mes = MESES[Number(sesion.fecha_inicio.slice(5, 7)) - 1];
                  const hora = sesion.fecha_inicio.slice(11, 16);
                  const clases = [
                    "sesiones-timeline__item",
                    sesion.id === seleccionadaId &&
                      "sesiones-timeline__item--seleccionada",
                    sesion.estado === "ABIERTA" && "sesiones-timeline__item--abierta",
                    sesion.estado === "CANCELADA" &&
                      "sesiones-timeline__item--cancelada",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <button
                      key={sesion.id}
                      type="button"
                      className={clases}
                      aria-pressed={sesion.id === seleccionadaId}
                      aria-label={
                        sesion.estado === "ABIERTA"
                          ? `Continuar cargando la sesión del ${dia} ${mes} ${anio}`
                          : `Ver la sesión del ${dia} ${mes} ${anio}, ${sesion.evaluaciones_count} evaluaciones`
                      }
                      onClick={() => onSeleccionar(sesion)}>
                      <span className="sesiones-timeline__circulo-zona">
                        <span
                          className="sesiones-timeline__circulo"
                          style={{ width: d, height: d }}>
                          {sesion.evaluaciones_count}
                        </span>
                      </span>
                      <span className="sesiones-timeline__fecha">
                        {dia} {mes}
                      </span>
                      {sesion.estado === "ABIERTA" ? (
                        <span className="sesiones-timeline__estado">En carga</span>
                      ) : (
                        <span className="sesiones-timeline__hora">{hora}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <span className="sesiones-timeline__anio-label">{anio}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
