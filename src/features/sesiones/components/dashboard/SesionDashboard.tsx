import { Skeleton } from "@chakra-ui/react";
import { IconAlertTriangle, IconCircleCheck } from "@tabler/icons-react";
import { EvaluacionFoto } from "@/features/animales/components/EvaluacionFoto";
import { NIVEL_CC_HEX, nivelCC } from "@/features/animales/utils/ccColor";
import type { HistogramaBin } from "@/features/animales/types";
import { TIPO_RECOMENDACION_LABELS } from "@/features/recomendaciones/constants";
import type { AptitudVaca } from "@/features/recomendaciones/types";
import type { DashboardSesionData } from "@/features/sesiones/types";

type Props = {
  data: DashboardSesionData | null;
  loading: boolean;
  error: string;
  /** Fecha de la sesión: el semáforo de CC depende del mes. */
  fecha: string;
  /** Vacas con alguna recomendación pendiente. */
  requierenMedida: AptitudVaca[];
  requierenMedidaLoading: boolean;
};

const ESCALA = [1, 2, 3, 4, 5];

export function SesionDashboard({
  data,
  loading,
  error,
  fecha,
  requierenMedida,
  requierenMedidaLoading,
}: Props) {
  const histograma = data?.histograma ?? [];
  const criticos = histograma
    .filter((bin) => nivelCC(bin.valor_cc, fecha) === "critico")
    .reduce((total, bin) => total + bin.cantidad, 0);

  return (
    <section className="sesion-dashboard" aria-label="Dashboard de la sesión">
      {error && (
        <p className="status-message error" role="alert">
          {error}
        </p>
      )}

      <div className="sesion-dashboard__fila">
        <div className="sesion-dashboard__card">
          <h3>Cobertura del rodeo</h3>
          {loading ? (
            <Skeleton height="140px" />
          ) : (
            <Cobertura
              evaluados={data?.animales_evaluados ?? 0}
              total={data?.total_animales ?? 0}
            />
          )}
        </div>

        <div className="sesion-dashboard__card">
          <h3>Promedio de CC</h3>
          {loading ? (
            <Skeleton height="140px" />
          ) : (
            <Velocimetro promedio={data?.promedio ?? null} fecha={fecha} />
          )}
        </div>

        <div className="sesion-dashboard__card">
          <h3>Requieren medida</h3>
          {requierenMedidaLoading ? (
            <Skeleton height="140px" />
          ) : (
            <RequierenMedida vacas={requierenMedida} />
          )}
          {!loading && (
            <p
              className={`sesion-dashboard__criticos${
                criticos > 0 ? " sesion-dashboard__criticos--alerta" : ""
              }`}>
              {criticos > 0 ? (
                <>
                  <IconAlertTriangle size={15} stroke={1.75} />
                  {criticos === 1
                    ? "1 animal en condición crítica"
                    : `${criticos} animales en condición crítica`}
                </>
              ) : (
                <>
                  <IconCircleCheck size={15} stroke={1.75} />
                  Sin animales en condición crítica
                </>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="sesion-dashboard__card">
        <h3>Distribución por calificación</h3>
        {loading ? (
          <Skeleton height="70px" />
        ) : (
          <DistribucionApilada histograma={histograma} fecha={fecha} />
        )}
      </div>
    </section>
  );
}

/** Anillo neutro con el % del rodeo evaluado en la sesión. */
function Cobertura({ evaluados, total }: { evaluados: number; total: number }) {
  const pct = total > 0 ? Math.round((evaluados / total) * 100) : 0;
  const radio = 52;
  const circunferencia = 2 * Math.PI * radio;
  return (
    <div className="sesion-dashboard__cobertura">
      <svg viewBox="0 0 130 130" width="140" height="140" role="img" aria-label={`${pct}% del rodeo evaluado`}>
        <circle cx="65" cy="65" r={radio} fill="none" stroke="#e4ebf1" strokeWidth="12" />
        <circle
          cx="65"
          cy="65"
          r={radio}
          fill="none"
          stroke="#3e5c76"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * circunferencia} ${circunferencia}`}
          transform="rotate(-90 65 65)"
        />
        <text x="65" y="68" textAnchor="middle" className="sesion-dashboard__cobertura-pct">
          {pct}%
        </text>
        <text x="65" y="88" textAnchor="middle" className="sesion-dashboard__cobertura-label">
          evaluado
        </text>
      </svg>
    </div>
  );
}

/** Semicírculo con un tramo por calificación (1 a 5), coloreado con el
 * semáforo del mes de la sesión, y una aguja en el promedio. */
function Velocimetro({ promedio, fecha }: { promedio: number | null; fecha: string }) {
  const cx = 100;
  const cy = 100;
  const r = 78;
  const punto = (grados: number, radio = r) => {
    const rad = (grados * Math.PI) / 180;
    return [cx + radio * Math.cos(rad), cy - radio * Math.sin(rad)];
  };
  const tramo = (desde: number, hasta: number) => {
    const [x1, y1] = punto(desde);
    const [x2, y2] = punto(hasta);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };
  // 1 a la izquierda (180°), 5 a la derecha (0°); cada CC ocupa 36°.
  const anguloAguja =
    promedio === null ? null : 180 - ((Math.min(Math.max(promedio, 1), 5) - 1) / 4) * 180;

  return (
    <div className="sesion-dashboard__velocimetro">
      <svg viewBox="0 0 200 118" width="100%" height="130" role="img"
        aria-label={promedio === null ? "Sin promedio" : `Promedio de CC ${promedio.toFixed(2)}`}>
        {ESCALA.map((cc, i) => (
          <path
            key={cc}
            d={tramo(180 - i * 36 - 1, 180 - (i + 1) * 36 + 1)}
            fill="none"
            stroke={NIVEL_CC_HEX[nivelCC(cc, fecha)]}
            strokeWidth="18"
          />
        ))}
        {anguloAguja !== null && (
          <>
            <line
              x1={cx}
              y1={cy}
              x2={punto(anguloAguja, r - 22)[0]}
              y2={punto(anguloAguja, r - 22)[1]}
              stroke="#264632"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx={cx} cy={cy} r="6" fill="#264632" />
          </>
        )}
        <text x={punto(180, r)[0]} y="116" textAnchor="middle" className="sesion-dashboard__velocimetro-extremo">1</text>
        <text x={punto(0, r)[0]} y="116" textAnchor="middle" className="sesion-dashboard__velocimetro-extremo">5</text>
      </svg>
      <strong className="sesion-dashboard__velocimetro-valor">
        {promedio === null ? "—" : promedio.toFixed(2)}
      </strong>
    </div>
  );
}

function RequierenMedida({ vacas }: { vacas: AptitudVaca[] }) {
  if (vacas.length === 0) {
    return <p className="sesion-dashboard__vacio">Ningún animal requiere medida.</p>;
  }
  return (
    <ul className="sesion-dashboard__medidas">
      {vacas.map((vaca) => {
        const caravana = vaca.animal.caravana ?? `#${vaca.animal.id}`;
        const nivel = vaca.evaluacion
          ? nivelCC(vaca.evaluacion.valor_cc, vaca.evaluacion.fecha)
          : "normal";
        const pendiente = vaca.recomendaciones.find((r) => r.estado === "PENDIENTE");
        return (
          <li key={vaca.animal.id}>
            <span className={`sesion-dashboard__avatar sesion-dashboard__avatar--${nivel}`}>
              <EvaluacionFoto evaluacionId={vaca.evaluacion?.id ?? null} caravana={caravana} />
            </span>
            <span className="sesion-dashboard__medida-texto">
              <strong>{caravana}</strong>
              {pendiente && (
                <span className={`sesion-dashboard__medida sesion-dashboard__medida--${nivel}`}>
                  {TIPO_RECOMENDACION_LABELS[pendiente.tipo]}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Una barra horizontal con un tramo por CC, proporcional a la cantidad de
 * animales, con el color del semáforo del mes. */
function DistribucionApilada({
  histograma,
  fecha,
}: {
  histograma: HistogramaBin[];
  fecha: string;
}) {
  const total = histograma.reduce((suma, bin) => suma + bin.cantidad, 0);
  if (total === 0) {
    return <p className="sesion-dashboard__vacio">Sin evaluaciones para mostrar.</p>;
  }
  const cantidadDe = (cc: number) =>
    histograma.find((bin) => bin.valor_cc === cc)?.cantidad ?? 0;

  return (
    <div className="sesion-dashboard__distribucion">
      <div className="sesion-dashboard__barra" role="img"
        aria-label={ESCALA.map((cc) => `CC ${cc}: ${cantidadDe(cc)}`).join(", ")}>
        {ESCALA.filter((cc) => cantidadDe(cc) > 0).map((cc) => (
          <div
            key={cc}
            className="sesion-dashboard__tramo"
            style={{
              flexGrow: cantidadDe(cc),
              background: NIVEL_CC_HEX[nivelCC(cc, fecha)],
            }}
            title={`CC ${cc}: ${cantidadDe(cc)} ${cantidadDe(cc) === 1 ? "animal" : "animales"}`}>
            CC {cc} · {cantidadDe(cc)}
          </div>
        ))}
      </div>
      <ul className="sesion-dashboard__leyenda">
        {ESCALA.map((cc) => (
          <li key={cc}>
            <span
              className="sesion-dashboard__leyenda-color"
              style={{ background: NIVEL_CC_HEX[nivelCC(cc, fecha)] }}
            />
            CC {cc}
            <span className="sesion-dashboard__leyenda-cantidad">
              {cantidadDe(cc)} {cantidadDe(cc) === 1 ? "animal" : "animales"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
