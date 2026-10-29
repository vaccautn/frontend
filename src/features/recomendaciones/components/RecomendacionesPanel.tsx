import { useMemo, useState } from "react";
import { Button } from "@chakra-ui/react";
import {
  IconAlertTriangle,
  IconArrowsSplit,
  IconCheck,
  IconCircleCheck,
  IconClockPause,
  IconVaccine,
  IconX,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import { normalizeBackendDetail } from "@/features/auth";
import { ApiError } from "@/services/httpClient";
import { formatFecha } from "@/features/animales/utils/formatDate";
import { nivelCC } from "@/features/animales/utils/ccColor";
import { EvaluacionFoto } from "@/features/animales/components/EvaluacionFoto";
import { decidirRecomendaciones } from "../services/recomendacionesService";
import type {
  AptitudVaca,
  RecomendacionRead,
  TipoRecomendacion,
} from "../types";
import { TIPO_RECOMENDACION_LABELS } from "../constants";
import "./recomendaciones.css";

/** Opciones del selector de cada tarjeta, en el orden en que se muestran. */
const OPCIONES_MEDIDA: { tipo: TipoRecomendacion; label: string }[] = [
  { tipo: "DESTETE_TEMPORARIO", label: "Temporario" },
  { tipo: "DESTETE_PRECOZ", label: "Precoz" },
  { tipo: "TRATAMIENTO_HORMONAL", label: "Hormonal" },
];

const TIPO_LABELS = TIPO_RECOMENDACION_LABELS;

const ICONOS_MEDIDA: Record<TipoRecomendacion, typeof IconVaccine> = {
  DESTETE_PRECOZ: IconArrowsSplit,
  DESTETE_TEMPORARIO: IconClockPause,
  TRATAMIENTO_HORMONAL: IconVaccine,
};

const caravanaDe = (vaca: AptitudVaca) =>
  vaca.animal.caravana ?? `#${vaca.animal.id}`;

type Pendiente = { vaca: AptitudVaca; recs: RecomendacionRead[] };

type Props = {
  vacas: AptitudVaca[];
  loading: boolean;
  error: string;
  onDecidido: () => void;
};

export function RecomendacionesPanel({
  vacas,
  loading,
  error,
  onDecidido,
}: Props) {
  // Medida elegida por fila (animal_id -> tipo). Si una fila no tiene
  // elección explícita, se usa la primera recomendación pendiente de esa
  // vaca (orden alfabético, igual que devuelve el backend).
  const [seleccion, setSeleccion] = useState<Record<number, TipoRecomendacion>>(
    {},
  );
  const [decidiendo, setDecidiendo] = useState(false);

  const { pendientes, decididas } = useMemo(() => {
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
    };
  }, [vacas]);

  const medidaElegida = (vacaId: number, recs: RecomendacionRead[]) =>
    seleccion[vacaId] ?? recs[0].tipo;

  const elegirMedida = (vacaId: number, tipo: TipoRecomendacion) =>
    setSeleccion((current) => ({ ...current, [vacaId]: tipo }));

  const cantidadPrecoz = pendientes.filter(
    ({ vaca, recs }) =>
      medidaElegida(vaca.animal.id, recs) === "DESTETE_PRECOZ",
  ).length;

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

  // Con todo decidido alcanza con la sección de decididas, sin el título
  // general de "Recomendaciones".
  const soloDecididas =
    !loading && !error && pendientes.length === 0 && decididas.length > 0;

  return (
    <section className="sesion-seccion recomendaciones">
      {!soloDecididas && (
        <div className="sesion-seccion__titulo">
          <h2>Recomendaciones</h2>
          {!loading && !error && pendientes.length > 0 && (
            <span>
              {pendientes.length === 1
                ? "1 animal"
                : `${pendientes.length} animales`}{" "}
              · valores sugeridos según su CC
            </span>
          )}
        </div>
      )}

      {loading && <p className="recomendaciones__vacio">Cargando...</p>}
      {!loading && error && (
        <p className="status-message error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          {pendientes.length === 0 ? (
            // Con decisiones tomadas alcanza con el desplegable de abajo.
            decididas.length === 0 && (
              <div className="recomendaciones__sin-pendientes">
                <IconCircleCheck size={28} stroke={1.5} />
                <div>
                  <strong>No hay recomendaciones para hacer</strong>
                  <p>
                    {vacas.length === 0
                      ? "Todavía no hay vacas evaluadas para analizar."
                      : "Ninguna vaca evaluada necesita una medida de manejo."}
                  </p>
                </div>
              </div>
            )
          ) : (
            <>
              <ul className="sesion-tarjetas sesion-tarjetas--grandes">
                {pendientes.map(({ vaca, recs }) => {
                  const nivel = vaca.evaluacion
                    ? nivelCC(vaca.evaluacion.valor_cc, vaca.evaluacion.fecha)
                    : "normal";
                  const elegida = medidaElegida(vaca.animal.id, recs);
                  return (
                    <li
                      key={vaca.animal.id}
                      className={`sesion-tarjeta sesion-tarjeta--${nivel}`}>
                      <div className="sesion-tarjeta__media">
                        <EvaluacionFoto
                          evaluacionId={vaca.evaluacion?.id ?? null}
                          caravana={caravanaDe(vaca)}
                          ampliable
                        />
                        <span
                          className={`sesion-tarjeta__cc sesion-tarjeta__cc--${nivel}`}>
                          {vaca.evaluacion?.valor_cc ?? "—"}
                        </span>
                      </div>
                      <div className="sesion-tarjeta__cuerpo">
                        <strong className="sesion-tarjeta__caravana">
                          {caravanaDe(vaca)}
                        </strong>
                        <span className="sesion-tarjeta__sub">
                          {vaca.lote?.nombre ?? "Sin lote"}
                        </span>
                        <span className="sesion-tarjeta__label">Medida</span>
                        <div
                          className="sesion-tarjeta__opciones"
                          role="radiogroup"
                          aria-label={`Medida para ${caravanaDe(vaca)}`}>
                          {OPCIONES_MEDIDA.map(({ tipo, label }) => {
                            const disponible = recs.some(
                              (r) => r.tipo === tipo,
                            );
                            return (
                              <button
                                key={tipo}
                                type="button"
                                role="radio"
                                aria-checked={elegida === tipo}
                                disabled={!disponible}
                                title={
                                  disponible
                                    ? undefined
                                    : "No aplica para esta CC"
                                }
                                className={`sesion-tarjeta__opcion${
                                  elegida === tipo
                                    ? " sesion-tarjeta__opcion--activa"
                                    : ""
                                }`}
                                onClick={() =>
                                  elegirMedida(vaca.animal.id, tipo)
                                }>
                                {label}
                              </button>
                            );
                          })}
                        </div>
                        {elegida === "DESTETE_PRECOZ" && (
                          <span className="sesion-tarjeta__aviso">
                            <IconAlertTriangle size={14} stroke={1.75} />
                            Pasa a "Vaca seca"
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="recomendaciones__acciones">
                <span className="recomendaciones__resumen">
                  {pendientes.length === 1
                    ? "1 recomendación"
                    : `${pendientes.length} recomendaciones`}
                  {cantidadPrecoz > 0 &&
                    ` · ${
                      cantidadPrecoz === 1
                        ? "1 destete precoz pasa"
                        : `${cantidadPrecoz} destetes precoces pasan`
                    } a "Vaca seca"`}
                </span>
                <Button
                  colorPalette="brand"
                  variant="outline"
                  bg="var(--panel)"
                  loading={decidiendo}
                  onClick={aceptarTodas}>
                  Aceptar recomendaciones
                </Button>
              </div>
            </>
          )}

          {decididas.length > 0 && (
            <div className="recomendaciones__decididas">
              <div className="sesion-seccion__titulo">
                <h2 className="recomendaciones__decididas-titulo">
                  <IconCircleCheck size={20} stroke={1.75} />
                  Recomendaciones decididas
                </h2>
                <span>{resumenDecididas(decididas.map(({ rec }) => rec))}</span>
              </div>
              <ul className="sesion-tarjetas sesion-tarjetas--grandes">
                {decididas.map(({ rec, vaca }) => {
                  const nivel = vaca.evaluacion
                    ? nivelCC(rec.valor_cc, vaca.evaluacion.fecha)
                    : "normal";
                  const IconoMedida = ICONOS_MEDIDA[rec.tipo];
                  return (
                    <li key={rec.id} className="sesion-tarjeta">
                      <div className="sesion-tarjeta__media sesion-tarjeta__media--media">
                        <EvaluacionFoto
                          evaluacionId={rec.evaluacion_cc_id}
                          caravana={caravanaDe(vaca)}
                          ampliable
                        />
                        <span
                          className={`sesion-tarjeta__cc sesion-tarjeta__cc--${nivel}`}>
                          {rec.valor_cc}
                        </span>
                        <span
                          className={`sesion-tarjeta__sello sesion-tarjeta__sello--${rec.estado}`}>
                          {rec.estado === "ACEPTADA" ? (
                            <IconCheck size={14} stroke={2.25} />
                          ) : (
                            <IconX size={14} stroke={2.25} />
                          )}
                          {rec.estado === "ACEPTADA" ? "Aceptada" : "Rechazada"}
                        </span>
                      </div>
                      <div className="sesion-tarjeta__cuerpo">
                        <strong className="sesion-tarjeta__caravana">
                          {caravanaDe(vaca)}
                        </strong>
                        <span className="sesion-tarjeta__chip">
                          <IconoMedida size={14} stroke={1.75} />
                          {TIPO_LABELS[rec.tipo]}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

/** "3 aceptadas el 27/10/2026", "2 aceptadas · 1 rechazada", etc. La fecha
 * solo se muestra si todas se decidieron el mismo día. */
function resumenDecididas(recs: RecomendacionRead[]): string {
  const aceptadas = recs.filter((r) => r.estado === "ACEPTADA").length;
  const rechazadas = recs.length - aceptadas;
  const partes = [
    aceptadas > 0 && `${aceptadas} aceptada${aceptadas === 1 ? "" : "s"}`,
    rechazadas > 0 && `${rechazadas} rechazada${rechazadas === 1 ? "" : "s"}`,
  ].filter(Boolean);
  const dias = new Set(
    recs.map((r) => r.fecha_decision?.slice(0, 10)).filter(Boolean),
  );
  const fecha =
    dias.size === 1 ? ` el ${formatFecha([...dias][0] as string)}` : "";
  return partes.join(" · ") + fecha;
}
