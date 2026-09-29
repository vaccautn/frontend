import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Button,
  Portal,
  Select,
  Spinner,
  Table,
  createListCollection,
} from "@chakra-ui/react";
import {
  IconChevronDown,
  IconCircleCheck,
  IconPhoto,
  IconX,
} from "@tabler/icons-react";
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

  const { pendientes, decididas, sinCc } = useMemo(() => {
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
      sinCc: vacas.filter((v) => v.aptitud === "SIN_CC"),
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
              <p className="recomendaciones__subtitulo">
                Los valores por defecto son recomendaciones para cada caso en
                particular.
              </p>
              <div className="animal-evaluaciones-table__wrapper">
                <Table.Root className="animales-table animal-evaluaciones-table">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader className="recomendaciones__col-foto">
                        Foto
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>Animal</Table.ColumnHeader>
                      <Table.ColumnHeader>Lote</Table.ColumnHeader>
                      <Table.ColumnHeader>CC</Table.ColumnHeader>
                      <Table.ColumnHeader className="recomendaciones__col-medida">
                        Medida
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {pendientes.map(({ vaca, recs }) => {
                      const nivel = vaca.evaluacion
                        ? nivelCC(vaca.evaluacion.valor_cc, vaca.evaluacion.fecha)
                        : "normal";
                      return (
                        <Table.Row key={vaca.animal.id}>
                          <Table.Cell className="recomendaciones__col-foto">
                            <RecomendacionFoto
                              evaluacionId={vaca.evaluacion?.id ?? null}
                              caravana={caravanaDe(vaca)}
                            />
                          </Table.Cell>
                          <Table.Cell>{caravanaDe(vaca)}</Table.Cell>
                          <Table.Cell>{vaca.lote?.nombre ?? "Sin lote"}</Table.Cell>
                          <Table.Cell>
                            <span
                              className={`animal-evaluaciones-table__cc animal-evaluaciones-table__cc--${nivel}`}>
                              {vaca.evaluacion?.valor_cc ?? "—"}
                            </span>
                          </Table.Cell>
                          <Table.Cell className="recomendaciones__col-medida">
                            <MedidaSelect
                              caravana={caravanaDe(vaca)}
                              recs={recs}
                              value={medidaElegida(vaca.animal.id, recs)}
                              onChange={(tipo) => elegirMedida(vaca.animal.id, tipo)}
                            />
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Root>
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
            <details
              className="recomendaciones__plegable"
              open={pendientes.length === 0}>
              <summary>
                <IconChevronDown
                  size={16}
                  stroke={1.75}
                  className="recomendaciones__plegable-icono"
                />
                Recomendaciones decididas
                <span className="recomendaciones__plegable-cantidad">
                  {decididas.length}
                </span>
              </summary>
              <div className="recomendaciones__decididas">
                <div className="recomendaciones__decidida recomendaciones__decidida--header">
                  <span>Animal</span>
                  <span>Medida</span>
                  <span>Estado</span>
                  <span>Fecha</span>
                </div>
                {decididas.map(({ rec, vaca }) => (
                  <div key={rec.id} className="recomendaciones__decidida">
                    <strong>{caravanaDe(vaca)}</strong>
                    <span>{TIPO_LABELS[rec.tipo]}</span>
                    <span>
                      <span
                        className={`recomendaciones__estado recomendaciones__estado--${rec.estado}`}>
                        {rec.estado === "ACEPTADA" ? "Aceptada" : "Rechazada"}
                      </span>
                    </span>
                    <span className="recomendaciones__fecha">
                      {rec.fecha_decision
                        ? formatFecha(rec.fecha_decision.slice(0, 10))
                        : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </details>
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

/** Desplegable de Chakra con las tres medidas; las que no aplican a la vaca
 * quedan deshabilitadas. */
function MedidaSelect({
  caravana,
  recs,
  value,
  onChange,
}: {
  caravana: string;
  recs: RecomendacionRead[];
  value: TipoRecomendacion;
  onChange: (tipo: TipoRecomendacion) => void;
}) {
  const collection = useMemo(
    () =>
      createListCollection({
        items: MEDIDAS.map(({ tipo, label }) => {
          const disponible = recs.some((r) => r.tipo === tipo);
          return {
            value: tipo,
            label: disponible ? label : `${label} (no aplica)`,
            disabled: !disponible,
          };
        }),
        isItemDisabled: (item) => item.disabled,
      }),
    [recs],
  );

  return (
    <Select.Root
      collection={collection}
      size="sm"
      colorPalette="brand"
      value={[value]}
      onValueChange={(details) => {
        const tipo = details.value[0] as TipoRecomendacion | undefined;
        if (tipo) onChange(tipo);
      }}
      positioning={{ sameWidth: true }}>
      <Select.HiddenSelect aria-label={`Medida para ${caravana}`} />
      <Select.Control>
        <Select.Trigger bg="var(--panel)">
          <Select.ValueText />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {collection.items.map((item) => (
              <Select.Item item={item} key={item.value}>
                {item.label}
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}

function RecomendacionFoto({
  evaluacionId,
  caravana,
}: {
  evaluacionId: number | null;
  caravana: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(evaluacionId !== null);
  const [ampliada, setAmpliada] = useState(false);

  useEffect(() => {
    if (!ampliada) return;
    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAmpliada(false);
    };
    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [ampliada]);

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

  if (loading || !url) {
    return (
      <div className="recomendaciones__foto">
        {loading ? <Spinner size="xs" /> : <IconPhoto size={16} stroke={1.5} />}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className="recomendaciones__foto recomendaciones__foto--boton"
        aria-label={`Ver foto de ${caravana} en pantalla completa`}
        onClick={() => setAmpliada(true)}>
        <img src={url} alt="" />
      </button>
      {ampliada && (
        <Portal>
          <div
            className="animal-imagenes__lightbox"
            onClick={() => setAmpliada(false)}>
            <button
              type="button"
              className="animal-imagenes__lightbox-close"
              aria-label="Cerrar"
              onClick={(event) => {
                event.stopPropagation();
                setAmpliada(false);
              }}>
              <IconX size={20} stroke={1.75} />
            </button>
            <img
              src={url}
              alt={`Evaluación de ${caravana} en pantalla completa`}
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        </Portal>
      )}
    </>
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
      <summary>
        <IconChevronDown
          size={16}
          stroke={1.75}
          className="recomendaciones__plegable-icono"
        />
        {titulo}
      </summary>
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
