import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Input, NativeSelect } from "@chakra-ui/react";
import { IconArrowLeft } from "@tabler/icons-react";
import { toast } from "react-toastify";
import {
  cargarResultadosServicio,
  getParticipantesServicio,
  getServicio,
} from "@/features/servicios/services/serviciosService";
import type {
  EstadoResultadoCargable,
  EstadoResultadoServicio,
  ParticipanteServicio,
  ServicioRead,
  TipoPrenez,
} from "@/features/servicios/types";
import {
  ESTADO_RESULTADO_SERVICIO_LABELS,
  TIPOS_PRENEZ,
  TIPO_PRENEZ_LABELS,
} from "@/features/servicios/constants";
import { ESTADO_ANIMAL_LABELS } from "@/features/animales/constants";
import { normalizeBackendDetail } from "@/features/auth";
import { ApiError } from "@/services/httpClient";
import { localNaiveNow } from "@/utils/localDateTime";
import "@/features/animales/components/animales.css";
import "@/features/servicios/components/servicios.css";

const OPCIONES_DIAGNOSTICO: { value: EstadoResultadoCargable; label: string }[] =
  [
    { value: "PENDIENTE", label: "Pendiente" },
    { value: "PRENADA", label: "Preñada" },
    { value: "VACIA", label: "Vacía" },
  ];

function esCargable(
  estado: EstadoResultadoServicio,
): estado is EstadoResultadoCargable {
  return estado === "PENDIENTE" || estado === "PRENADA" || estado === "VACIA";
}

type Diagnostico = { estado: EstadoResultadoCargable; tipo: TipoPrenez | "" };

type PageStatus = "loading" | "ready" | "error" | "not-found";

export function CargarResultadosServicioPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const servicioId = Number(id);
  const hoy = localNaiveNow().slice(0, 10);

  const [status, setStatus] = useState<PageStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [servicio, setServicio] = useState<ServicioRead | null>(null);
  const [participantes, setParticipantes] = useState<ParticipanteServicio[]>(
    [],
  );
  const [diagnosticos, setDiagnosticos] = useState<Map<number, Diagnostico>>(
    new Map(),
  );
  const [fechaDiagnostico, setFechaDiagnostico] = useState(hoy);
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(async () => {
      if (!Number.isInteger(servicioId) || servicioId <= 0) {
        if (!cancelled) setStatus("not-found");
        return;
      }
      try {
        const servicioData = await getServicio(servicioId);
        const participantesData = await getParticipantesServicio(servicioId);
        if (cancelled) return;
        setServicio(servicioData);
        setParticipantes(participantesData);
        setDiagnosticos(
          new Map(
            participantesData
              .filter((p) => esCargable(p.resultado.estado))
              .map((p) => [
                p.resultado.id,
                {
                  estado: p.resultado.estado as EstadoResultadoCargable,
                  tipo: p.resultado.tipo_prenez ?? "",
                },
              ]),
          ),
        );
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) {
          setStatus("not-found");
          return;
        }
        setErrorMessage("No se pudieron cargar las vacas del servicio.");
        setStatus("error");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [servicioId]);

  const resumen = useMemo(() => {
    const conteo = { PRENADA: 0, VACIA: 0, PENDIENTE: 0 };
    for (const diagnostico of diagnosticos.values()) {
      conteo[diagnostico.estado] += 1;
    }
    return conteo;
  }, [diagnosticos]);

  const faltaTipo = (diagnostico: Diagnostico | undefined) =>
    diagnostico?.estado === "PRENADA" && !diagnostico.tipo;

  const actualizarDiagnostico = (
    resultadoId: number,
    cambio: Partial<Diagnostico>,
  ) => {
    setDiagnosticos((current) => {
      const actual = current.get(resultadoId);
      if (!actual) return current;
      const siguiente = { ...actual, ...cambio };
      if (siguiente.estado !== "PRENADA") siguiente.tipo = "";
      return new Map(current).set(resultadoId, siguiente);
    });
    setFormError("");
  };

  const volverAlServicio = () => navigate(`/servicios/${servicioId}`);

  const handleGuardar = async () => {
    if (isSaving) return;
    setMostrarErrores(true);

    if (!fechaDiagnostico) {
      setFormError("La fecha de diagnóstico es obligatoria.");
      return;
    }
    const sinTipo = [...diagnosticos.values()].filter(faltaTipo).length;
    if (sinTipo > 0) {
      setFormError(
        sinTipo === 1
          ? "Falta elegir el tipo de preñez de 1 vaca."
          : `Falta elegir el tipo de preñez de ${sinTipo} vacas.`,
      );
      return;
    }

    setIsSaving(true);
    try {
      await cargarResultadosServicio(servicioId, {
        fecha_diagnostico: fechaDiagnostico,
        resultados: [...diagnosticos.entries()].map(
          ([resultadoId, { estado, tipo }]) => ({
            resultado_id: resultadoId,
            estado,
            ...(tipo ? { tipo_prenez: tipo } : {}),
          }),
        ),
      });
      toast.success("Resultados guardados correctamente.");
      volverAlServicio();
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? (normalizeBackendDetail(error.detail) ??
              "No se pudieron guardar los resultados.")
          : "No se pudieron guardar los resultados. Probá nuevamente.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="animal-page">
      <div className="animal-page__topbar">
        <Button
          colorPalette="brand"
          variant="ghost"
          paddingInlineStart="0.75rem"
          paddingInlineEnd="0.75rem"
          marginInlineStart="-0.75rem"
          className="animal-page__back-link"
          onClick={volverAlServicio}>
          <IconArrowLeft size={16} stroke={1.5} />
          Volver al servicio
        </Button>
      </div>

      {status === "loading" && <p>Cargando...</p>}

      {status === "not-found" && (
        <p className="status-message error" role="alert">
          El servicio ya no está disponible.
        </p>
      )}

      {status === "error" && (
        <p className="status-message error" role="alert">
          {errorMessage}
        </p>
      )}

      {status === "ready" && servicio && servicio.estado !== "FINALIZADO" && (
        <p className="status-message error" role="alert">
          Solo se pueden cargar resultados de un servicio finalizado.
          {servicio.estado === "CERRADO" &&
            " Este servicio está cerrado: reabrilo desde su detalle para modificar los resultados."}
        </p>
      )}

      {status === "ready" && servicio && servicio.estado === "FINALIZADO" && (
        <>
          <div className="animal-page__hero">
            <div>
              <span className="animal-page__eyebrow">Cargar resultados</span>
              <h1>{servicio.nombre || `Servicio #${servicio.id}`}</h1>
            </div>
          </div>

          <div className="cargar-resultados__encabezado">
            <label className="cargar-resultados__fecha">
              <span>Fecha de diagnóstico</span>
              <Input
                type="date"
                max={hoy}
                value={fechaDiagnostico}
                onChange={(event) => {
                  setFechaDiagnostico(event.target.value);
                  setFormError("");
                }}
              />
            </label>
            <p className="cargar-resultados__resumen">
              {resumen.PRENADA} preñada{resumen.PRENADA === 1 ? "" : "s"} ·{" "}
              {resumen.VACIA} vacía{resumen.VACIA === 1 ? "" : "s"} ·{" "}
              {resumen.PENDIENTE} pendiente
              {resumen.PENDIENTE === 1 ? "" : "s"}
            </p>
          </div>

          {participantes.length === 0 ? (
            <p className="servicio-detail__lotes-vacio">
              Este servicio no tiene vacas participantes.
            </p>
          ) : (
            <ul className="cargar-resultados__lista">
              {participantes.map((participante) => (
                <FilaResultado
                  key={participante.resultado.id}
                  participante={participante}
                  diagnostico={diagnosticos.get(participante.resultado.id)}
                  mostrarErrorTipo={
                    mostrarErrores &&
                    faltaTipo(diagnosticos.get(participante.resultado.id))
                  }
                  onChange={(cambio) =>
                    actualizarDiagnostico(participante.resultado.id, cambio)
                  }
                />
              ))}
            </ul>
          )}

          {formError && (
            <p className="status-message error" role="alert">
              {formError}
            </p>
          )}

          <div className="cargar-resultados__acciones">
            <Button
              type="button"
              variant="outline"
              className="animal-form__cancel"
              onClick={volverAlServicio}
              disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              colorPalette="brand"
              onClick={handleGuardar}
              loading={isSaving}
              loadingText="Guardando..."
              disabled={diagnosticos.size === 0}>
              Guardar resultados
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

type FilaResultadoProps = {
  participante: ParticipanteServicio;
  /** undefined: la vaca está Parida o con Aborto, no se carga desde acá. */
  diagnostico: Diagnostico | undefined;
  mostrarErrorTipo: boolean;
  onChange: (cambio: Partial<Diagnostico>) => void;
};

function FilaResultado({
  participante,
  diagnostico,
  mostrarErrorTipo,
  onChange,
}: FilaResultadoProps) {
  const { animal, resultado, lote_participacion, lote_actual } = participante;
  const caravana = animal.caravana ?? `#${animal.id}`;

  const aclaraciones: string[] = [];
  if (animal.estado !== "ACTIVO") {
    aclaraciones.push(ESTADO_ANIMAL_LABELS[animal.estado] ?? animal.estado);
  } else if (animal.lote_id !== resultado.lote_id) {
    aclaraciones.push(
      lote_actual
        ? `Actualmente en lote ${lote_actual.nombre}`
        : "Actualmente sin lote",
    );
  }

  return (
    <li className="cargar-resultados__fila">
      <div className="cargar-resultados__vaca">
        <strong>{caravana}</strong>
        <span>{lote_participacion?.nombre ?? "Sin lote"}</span>
        {aclaraciones.map((texto) => (
          <span key={texto} className="servicio-detail__vaca-motivo">
            {texto}
          </span>
        ))}
      </div>

      {diagnostico ? (
        <div className="cargar-resultados__controles">
          <div
            className="cargar-resultados__opciones"
            role="radiogroup"
            aria-label={`Diagnóstico de la vaca ${caravana}`}>
            {OPCIONES_DIAGNOSTICO.map(({ value, label }) => (
              <label
                key={value}
                className={`cargar-resultados__opcion${
                  diagnostico.estado === value
                    ? ` cargar-resultados__opcion--activa cargar-resultados__opcion--${value}`
                    : ""
                }`}>
                <input
                  type="radio"
                  name={`diagnostico-${resultado.id}`}
                  value={value}
                  checked={diagnostico.estado === value}
                  onChange={() => onChange({ estado: value })}
                />
                {label}
              </label>
            ))}
          </div>

          {diagnostico.estado === "PRENADA" && (
            <div className="cargar-resultados__tipo">
              <NativeSelect.Root size="sm" invalid={mostrarErrorTipo}>
                <NativeSelect.Field
                  aria-label={`Tipo de preñez de la vaca ${caravana}`}
                  value={diagnostico.tipo}
                  onChange={(event) =>
                    onChange({ tipo: event.target.value as TipoPrenez | "" })
                  }>
                  <option value="">Tipo de preñez</option>
                  {TIPOS_PRENEZ.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
              {mostrarErrorTipo && (
                <span className="cargar-resultados__error">
                  Elegí el tipo de preñez.
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="cargar-resultados__controles">
          <span
            className={`resultado-badge resultado-badge--${resultado.estado}`}>
            {ESTADO_RESULTADO_SERVICIO_LABELS[resultado.estado] ??
              resultado.estado}
            {resultado.tipo_prenez &&
              ` · ${TIPO_PRENEZ_LABELS[resultado.tipo_prenez]}`}
          </span>
          <span className="servicio-detail__vaca-motivo">
            No se modifica desde esta pantalla
          </span>
        </div>
      )}
    </li>
  );
}
