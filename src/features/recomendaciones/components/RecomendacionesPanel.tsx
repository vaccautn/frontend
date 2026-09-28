import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@chakra-ui/react";
import { toast } from "react-toastify";
import { normalizeBackendDetail } from "@/features/auth";
import { ApiError } from "@/services/httpClient";
import { formatFecha } from "@/features/animales/utils/formatDate";
import { decidirRecomendaciones } from "../services/recomendacionesService";
import type {
  AptitudVaca,
  RecomendacionRead,
  TipoRecomendacion,
} from "../types";
import "./recomendaciones.css";

/** Orden y nombres de los grupos. "Destete temporario" es el término del
 * cliente (el criterio de aceptación decía "temporal"). */
const GRUPOS_RECOMENDACION: { tipo: TipoRecomendacion; label: string }[] =
  [
    { tipo: "TRATAMIENTO_HORMONAL", label: "Tratamiento hormonal" },
    { tipo: "DESTETE_PRECOZ", label: "Destete precoz" },
    { tipo: "DESTETE_TEMPORARIO", label: "Destete temporario" },
  ];

const TIPO_LABELS: Record<TipoRecomendacion, string> = Object.fromEntries(
  GRUPOS_RECOMENDACION.map(({ tipo, label }) => [tipo, label]),
) as Record<TipoRecomendacion, string>;

type Item = { rec: RecomendacionRead; vaca: AptitudVaca };

const caravanaDe = (vaca: AptitudVaca) =>
  vaca.animal.caravana ?? `#${vaca.animal.id}`;

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
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set());
  const [decidiendo, setDecidiendo] = useState(false);

  const { pendientesPorTipo, decididas, aptas, sinCc, conRecomendacion } =
    useMemo(() => {
      const porTipo = new Map<TipoRecomendacion, Item[]>(
        GRUPOS_RECOMENDACION.map(({ tipo }) => [tipo, []]),
      );
      const yaDecididas: Item[] = [];
      for (const vaca of vacas) {
        for (const rec of vaca.recomendaciones) {
          if (rec.estado === "PENDIENTE") porTipo.get(rec.tipo)?.push({ rec, vaca });
          else yaDecididas.push({ rec, vaca });
        }
      }
      yaDecididas.sort((a, b) =>
        (b.rec.fecha_decision ?? "").localeCompare(a.rec.fecha_decision ?? ""),
      );
      return {
        pendientesPorTipo: porTipo,
        decididas: yaDecididas,
        aptas: vacas.filter((v) => v.aptitud === "APTA"),
        sinCc: vacas.filter((v) => v.aptitud === "SIN_CC"),
        conRecomendacion: vacas.filter((v) => v.aptitud === "CON_RECOMENDACION")
          .length,
      };
    }, [vacas]);

  const idsPendientes = useMemo(
    () =>
      new Set(
        [...pendientesPorTipo.values()].flatMap((items) =>
          items.map((i) => i.rec.id),
        ),
      ),
    [pendientesPorTipo],
  );
  // La selección solo cuenta recomendaciones que siguen pendientes.
  const seleccionadas = [...seleccion].filter((id) => idsPendientes.has(id));
  const incluyePrecoz = (pendientesPorTipo.get("DESTETE_PRECOZ") ?? []).some(
    (item) => seleccion.has(item.rec.id),
  );

  const toggle = (id: number) =>
    setSeleccion((current) => {
      const siguiente = new Set(current);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });

  const toggleGrupo = (items: Item[], marcar: boolean) =>
    setSeleccion((current) => {
      const siguiente = new Set(current);
      for (const { rec } of items) {
        if (marcar) siguiente.add(rec.id);
        else siguiente.delete(rec.id);
      }
      return siguiente;
    });

  const decidir = async (estado: "ACEPTADA" | "RECHAZADA") => {
    if (seleccionadas.length === 0 || decidiendo) return;
    setDecidiendo(true);
    try {
      await decidirRecomendaciones({ ids: seleccionadas, estado });
      toast.success(
        `${seleccionadas.length} recomendación${
          seleccionadas.length === 1 ? "" : "es"
        } ${estado === "ACEPTADA" ? "aceptada" : "rechazada"}${
          seleccionadas.length === 1 ? "" : "s"
        }.`,
      );
      setSeleccion(new Set());
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

  const hayPendientes = idsPendientes.size > 0;

  return (
    <section className="animal-detail__section recomendaciones">
      <div className="animal-detail__section-header">
        <div>
          <span className="animal-detail__section-eyebrow">Preservicio</span>
          <h2>Recomendaciones</h2>
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
          ) : (
            <>
              {hayPendientes ? (
                <div className="recomendaciones__grupos">
                  {GRUPOS_RECOMENDACION.map(({ tipo, label }) => {
                    const items = pendientesPorTipo.get(tipo) ?? [];
                    if (items.length === 0) return null;
                    const todas = items.every((i) => seleccion.has(i.rec.id));
                    return (
                      <div key={tipo} className="recomendaciones__grupo">
                        <label className="recomendaciones__grupo-header">
                          <input
                            type="checkbox"
                            checked={todas}
                            onChange={() => toggleGrupo(items, !todas)}
                            aria-label={`Seleccionar todo: ${label}`}
                          />
                          <span>{label}</span>
                          <span className="recomendaciones__cantidad">
                            {items.length}
                          </span>
                          <span className="recomendaciones__seleccionar-todo">
                            Seleccionar todo
                          </span>
                        </label>
                        <ul className="recomendaciones__lista">
                          {items.map(({ rec, vaca }) => (
                            <li key={rec.id}>
                              <label className="recomendaciones__item">
                                <input
                                  type="checkbox"
                                  checked={seleccion.has(rec.id)}
                                  onChange={() => toggle(rec.id)}
                                />
                                <span className="recomendaciones__vaca">
                                  <strong>{caravanaDe(vaca)}</strong>
                                  <span>{vaca.lote?.nombre ?? "Sin lote"}</span>
                                  <span className="recomendaciones__cc">
                                    CC {rec.valor_cc}
                                  </span>
                                </span>
                                <span className="recomendaciones__motivo">
                                  {rec.descripcion}
                                </span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="recomendaciones__vacio">
                  No hay recomendaciones pendientes.
                </p>
              )}

              {hayPendientes && (
                <div className="recomendaciones__acciones">
                  {incluyePrecoz && (
                    <p className="recomendaciones__aviso">
                      Al aceptar un destete precoz, la vaca pasa a la categoría
                      "Vaca seca".
                    </p>
                  )}
                  <span className="recomendaciones__cantidad-seleccion">
                    {seleccionadas.length} seleccionada
                    {seleccionadas.length === 1 ? "" : "s"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={seleccionadas.length === 0}
                    loading={decidiendo}
                    onClick={() => decidir("RECHAZADA")}>
                    Rechazar
                  </Button>
                  <Button
                    colorPalette="brand"
                    size="sm"
                    disabled={seleccionadas.length === 0}
                    loading={decidiendo}
                    onClick={() => decidir("ACEPTADA")}>
                    Aceptar
                  </Button>
                </div>
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
        </>
      )}
    </section>
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
