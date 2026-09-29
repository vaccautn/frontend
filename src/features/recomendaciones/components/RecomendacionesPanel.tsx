import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button, Spinner } from "@chakra-ui/react";
import { IconPhoto } from "@tabler/icons-react";
import { toast } from "react-toastify";
import { normalizeBackendDetail } from "@/features/auth";
import { ApiError } from "@/services/httpClient";
import { formatFecha } from "@/features/animales/utils/formatDate";
import { nivelCC } from "@/features/animales/utils/ccColor";
import { getImagenesEvaluacion } from "@/features/animales/services/animalesService";
import { decidirRecomendaciones } from "../services/recomendacionesService";
import type {
  AptitudVaca,
  RecomendacionRead,
  TipoRecomendacion,
} from "../types";
import "./recomendaciones.css";

/** Orden y nombres de las medidas. "Destete temporario" es el término del
 * cliente (el criterio de aceptación decía "temporal"). Coincide con el
 * orden alfabético con el que el backend devuelve las recomendaciones. */
const MEDIDAS: { tipo: TipoRecomendacion; label: string }[] = [
  { tipo: "DESTETE_PRECOZ", label: "Destete precoz" },
  { tipo: "DESTETE_TEMPORARIO", label: "Destete temporario" },
  { tipo: "TRATAMIENTO_HORMONAL", label: "Tratamiento hormonal" },
];

const TIPO_LABELS: Record<TipoRecomendacion, string> = Object.fromEntries(
  MEDIDAS.map(({ tipo, label }) => [tipo, label]),
) as Record<TipoRecomendacion, string>;

const caravanaDe = (vaca: AptitudVaca) =>
  vaca.animal.caravana ?? `#${vaca.animal.id}`;

type Pendiente = { vaca: AptitudVaca; recs: RecomendacionRead[] };

type Props = {
  vacas: AptitudVaca[];
  loading: boolean;
  error: string;
  /** Solo por servicio: vacas sin evaluación de CC dentro de la ventana. */
  mostrarSinCc?: boolean;
  /** Controles extra en el encabezado (p. ej. la ventana de días). */
  controles?: ReactNode;
  onDecidido: () => void;
};

export function RecomendacionesPanel({
  vacas,
  loading,
  error,
  mostrarSinCc = false,
  controles,
  onDecidido,
}: Props) {
  // Medida elegida por fila (animal_id -> tipo). Si una fila no tiene
  // elección explícita, se usa la primera recomendación pendiente de esa
  // vaca (orden alfabético, igual que devuelve el backend).
  const [seleccion, setSeleccion] = useState<Record<number, TipoRecomendacion>>(
    {},
  );
  const [decidiendo, setDecidiendo] = useState(false);

  const { pendientes, decididas, aptas, sinCc, conRecomendacion } =
    useMemo(() => {
      const pend: Pendiente[] = [];
      const yaDecididas: { rec: RecomendacionRead; vaca: AptitudVaca }[] = [];
      for (const vaca of vacas) {
        const recsPendientes = vaca.recomendaciones.filter(
          (r) => r.estado === "PENDIENTE",
        );
        if (recsPendientes.length > 0) pend.push({ vaca, recs: recsPendientes });
        for (const rec of vaca.recomendaciones) {
          if (rec.estado !== "PENDIENTE") yaDecididas.push({ rec, vaca });
        }
      }
      yaDecididas.sort((a, b) =>
        (b.rec.fecha_decision ?? "").localeCompare(a.rec.fecha_decision ?? ""),
      );
      return {
        pendientes: pend,
        decididas: yaDecididas,
        aptas: vacas.filter((v) => v.aptitud === "APTA"),
        sinCc: vacas.filter((v) => v.aptitud === "SIN_CC"),
        conRecomendacion: vacas.filter((v) => v.aptitud === "CON_RECOMENDACION")
          .length,
      };
    }, [vacas]);

  const medidaElegida = (vacaId: number, recs: RecomendacionRead[]) =>
    seleccion[vacaId] ?? recs[0].tipo;

  const elegirMedida = (vacaId: number, tipo: TipoRecomendacion) =>
    setSeleccion((current) => ({ ...current, [vacaId]: tipo }));

  const incluyePrecoz = pendientes.some(
    ({ vaca, recs }) => medidaElegida(vaca.animal.id, recs) === "DESTETE_PRECOZ",
  );

  const aceptarTodas = async () => {
    if (pendientes.length === 0 || decidiendo) return;
    const ids = pendientes.map(({ vaca, recs }) => {
      const tipo = medidaElegida(vaca.animal.id, recs);
      return (recs.find((r) => r.tipo === tipo) ?? recs[0]).id;
    });
    setDecidiendo(true);
    try {
      await decidirRecomendaciones({ ids, estado: "ACEPTADA" });
      toast.success(
        `${ids.length} recomendación${ids.length === 1 ? "" : "es"} aceptada${
          ids.length === 1 ? "" : "s"
        }.`,
      );
      setSeleccion({});
      onDecidido();
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? (normalizeBackendDetail(err.detail) ??
              "No se pudieron guardar las decisiones.")
          : "No se pudieron guardar las decisiones.",
      );
    } finally {
      setDecidiendo(false);
    }
  };

  return (
    <section className="animal-detail__section recomendaciones">
      <div className="animal-detail__section-header">
        <div>
          <span className="animal-detail__section-eyebrow">Preservicio</span>
          <h2>Calificaciones críticas</h2>
        </div>
        {controles}
      </div>

      {loading && <p className="recomendaciones__vacio">Cargando...</p>}
      {!loading && error && (
        <p className="status-message error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <p className="recomendaciones__subtitulo">
            Los valores por defecto son recomendaciones para cada caso en
            particular.
          </p>
          <p className="recomendaciones__resumen">
            <strong>{aptas.length}</strong> apta{aptas.length === 1 ? "" : "s"}{" "}
            para servicio · <strong>{conRecomendacion}</strong> con
            recomendación
            {mostrarSinCc && (
              <>
                {" "}
                · <strong>{sinCc.length}</strong> sin CC
              </>
            )}
          </p>

          {vacas.length === 0 ? (
            <p className="recomendaciones__vacio">
              No hay vacas evaluadas para mostrar.
            </p>
          ) : pendientes.length === 0 ? (
            <p className="recomendaciones__vacio">
              No hay recomendaciones pendientes.
            </p>
          ) : (
            <>
              <div className="recomendaciones__tabla">
                <div className="recomendaciones__tabla-header">
                  <span>Animal</span>
                  <span>Calificación</span>
                  <span>Medida</span>
                </div>
                <ul className="recomendaciones__filas">
                  {pendientes.map(({ vaca, recs }) => {
                    const tipoElegido = medidaElegida(vaca.animal.id, recs);
                    const nivel = vaca.evaluacion
                      ? nivelCC(vaca.evaluacion.valor_cc, vaca.evaluacion.fecha)
                      : "normal";
                    return (
                      <li key={vaca.animal.id} className="recomendaciones__fila">
                        <RecomendacionFoto
                          evaluacionId={vaca.evaluacion?.id ?? null}
                        />
                        <span className="recomendaciones__animal">
                          <strong>{caravanaDe(vaca)}</strong>
                          <span>{vaca.lote?.nombre ?? "Sin lote"}</span>
                        </span>
                        <span
                          className={`recomendaciones__cc recomendaciones__cc--${nivel}`}>
                          CC {vaca.evaluacion?.valor_cc ?? "—"}
                        </span>
                        <select
                          className="recomendaciones__medida"
                          value={tipoElegido}
                          onChange={(event) =>
                            elegirMedida(
                              vaca.animal.id,
                              event.target.value as TipoRecomendacion,
                            )
                          }
                          aria-label={`Medida para ${caravanaDe(vaca)}`}>
                          {MEDIDAS.map(({ tipo, label }) => {
                            const disponible = recs.some((r) => r.tipo === tipo);
                            return (
                              <option key={tipo} value={tipo} disabled={!disponible}>
                                {label}
                                {disponible ? "" : " (no aplica)"}
                              </option>
                            );
                          })}
                        </select>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="recomendaciones__acciones">
                {incluyePrecoz && (
                  <p className="recomendaciones__aviso">
                    Al aceptar un destete precoz, la vaca pasa a la categoría
                    "Vaca seca".
                  </p>
                )}
                <Button
                  colorPalette="brand"
                  size="sm"
                  loading={decidiendo}
                  onClick={aceptarTodas}>
                  Aceptar
                </Button>
              </div>
            </>
          )}

          {decididas.length > 0 && (
            <details className="recomendaciones__plegable">
              <summary>Decididas ({decididas.length})</summary>
              <ul className="recomendaciones__lista">
                {decididas.map(({ rec, vaca }) => (
                  <li key={rec.id} className="recomendaciones__decidida">
                    <strong>{caravanaDe(vaca)}</strong>
                    <span>{TIPO_LABELS[rec.tipo]}</span>
                    <span
                      className={`recomendaciones__estado recomendaciones__estado--${rec.estado}`}>
                      {rec.estado === "ACEPTADA" ? "Aceptada" : "Rechazada"}
                    </span>
                    {rec.fecha_decision && (
                      <span className="recomendaciones__fecha">
                        {formatFecha(rec.fecha_decision.slice(0, 10))}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {aptas.length > 0 && (
            <ListaPlegable
              titulo={`Aptas para servicio (${aptas.length})`}
              vacas={aptas}
            />
          )}
          {mostrarSinCc && sinCc.length > 0 && (
            <ListaPlegable
              titulo={`Sin CC en el período (${sinCc.length})`}
              vacas={sinCc}
            />
          )}
        </>
      )}
    </section>
  );
}

function RecomendacionFoto({ evaluacionId }: { evaluacionId: number | null }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(evaluacionId !== null);

  useEffect(() => {
    // Sin evaluación no hay nada que buscar: el estado inicial (sin url,
    // sin loading) ya refleja ese caso.
    if (evaluacionId === null) return;
    let isMounted = true;
    setLoading(true);
    getImagenesEvaluacion(evaluacionId)
      .then((imagenes) => {
        if (isMounted) setUrl(imagenes[0]?.url ?? null);
      })
      .catch(() => {
        if (isMounted) setUrl(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [evaluacionId]);

  return (
    <div className="recomendaciones__foto">
      {loading ? (
        <Spinner size="xs" />
      ) : url ? (
        <img src={url} alt="" />
      ) : (
        <IconPhoto size={16} stroke={1.5} />
      )}
    </div>
  );
}

function ListaPlegable({
  titulo,
  vacas,
}: {
  titulo: string;
  vacas: AptitudVaca[];
}) {
  return (
    <details className="recomendaciones__plegable">
      <summary>{titulo}</summary>
      <ul className="recomendaciones__chips">
        {vacas.map((vaca) => (
          <li key={vaca.animal.id}>
            {caravanaDe(vaca)}
            {vaca.evaluacion && ` · CC ${vaca.evaluacion.valor_cc}`}
          </li>
        ))}
      </ul>
    </details>
  );
}
