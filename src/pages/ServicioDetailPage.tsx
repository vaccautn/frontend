import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Badge,
  Button,
  Field,
  Input,
  NativeSelect,
  Textarea,
} from "@chakra-ui/react";
import {
  IconArrowLeft,
  IconChevronDown,
  IconEdit,
  IconX,
} from "@tabler/icons-react";
import {
  actualizarServicio,
  asociarLoteServicio,
  crearResultadoServicio,
  desasociarLoteServicio,
  getLotesServicio,
  getResultadosServicio,
  getServicio,
} from "@/features/servicios/services/serviciosService";
import type {
  EstadoServicio,
  ResultadoServicioRead,
  ServicioLoteRead,
  ServicioLotesAgrupados,
  ServicioRead,
} from "@/features/servicios/types";
import {
  ESTADO_RESULTADO_SERVICIO_LABELS,
  ESTADO_SERVICIO_LABELS,
  ESTADOS_SERVICIO,
} from "@/features/servicios/constants";
import {
  validateServicioEditarForm,
  type ServicioEditarFieldErrors,
  type ServicioEditarValues,
} from "@/features/servicios/utils/serviciosValidation";
import { sincronizarEstadoServicio } from "@/features/servicios/utils/servicioEstado";
import { CATEGORIA_ANIMAL_LABELS } from "@/features/animales/constants";
import { formatFecha } from "@/features/animales/utils/formatDate";
import { normalizeBackendDetail } from "@/features/auth";
import { ApiError } from "@/services/httpClient";
import { getLotes } from "@/features/lotes/services/lotesService";
import type { LoteOption } from "@/features/lotes/types";
import { getAnimales } from "@/features/animales/services/animalesService";
import type { Animal } from "@/features/animales/types";
import { localNaiveNow } from "@/utils/localDateTime";
import { toast } from "react-toastify";
import "@/features/animales/components/animales.css";
import "@/features/servicios/components/servicios.css";

const CAMPOS: { label: string; render: (servicio: ServicioRead) => string }[] = [
  {
    label: "Fecha de inicio",
    render: (s) => formatFecha(s.fecha_inicio),
  },
  {
    label: "Fecha de fin",
    render: (s) => (s.fecha_fin ? formatFecha(s.fecha_fin) : "—"),
  },
];

const CAMPO_OBSERVACIONES = {
  label: "Observaciones",
  render: (servicio: ServicioRead) => servicio.observaciones || "—",
};

type DetailStatus = "loading" | "ready" | "error" | "not-found";

export function ServicioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const servicioId = Number(id);

  const [status, setStatus] = useState<DetailStatus>("loading");
  const [servicio, setServicio] = useState<ServicioRead | null>(null);
  const [lotes, setLotes] = useState<ServicioLotesAgrupados | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<ServicioEditarValues | null>(
    null,
  );
  const [editErrors, setEditErrors] = useState<ServicioEditarFieldErrors>({});
  const [editFormError, setEditFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [todosLosLotes, setTodosLosLotes] = useState<LoteOption[]>([]);
  const [loteIdParaAgregar, setLoteIdParaAgregar] = useState("");
  const [isAgregandoLote, setIsAgregandoLote] = useState(false);
  const [loteIdQuitando, setLoteIdQuitando] = useState<number | null>(null);

  const [resultados, setResultados] = useState<ResultadoServicioRead[]>([]);
  const [animalesPorLoteId, setAnimalesPorLoteId] = useState<
    Map<number, Animal[]>
  >(new Map());
  const [loadingVacas, setLoadingVacas] = useState(false);
  const [animalIdRegistrando, setAnimalIdRegistrando] = useState<
    number | null
  >(null);

  useEffect(() => {
    getLotes()
      .then(setTodosLosLotes)
      .catch(() => {
        /* la lista de lotes disponibles es un extra del modo edición; si
         * falla, el "Agregar lote" simplemente queda sin opciones */
      });
  }, []);

  const fetchVacas = async (vientres: ServicioLoteRead[]) => {
    if (vientres.length === 0) {
      setAnimalesPorLoteId(new Map());
      return;
    }
    setLoadingVacas(true);
    try {
      const entradas = await Promise.all(
        vientres.map((lote) =>
          getAnimales({ lote_id: lote.id }).then(
            (animales) => [lote.id, animales] as const,
          ),
        ),
      );
      setAnimalesPorLoteId(new Map(entradas));
    } catch {
      // si falla, esa sección simplemente no lista vacas: no bloquea el
      // resto del detalle del servicio
    } finally {
      setLoadingVacas(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(async () => {
      if (!Number.isInteger(servicioId) || servicioId <= 0) {
        if (!cancelled) setStatus("not-found");
        return;
      }

      setStatus("loading");

      try {
        const [servicioDataRaw, lotesData, resultadosData] = await Promise.all([
          getServicio(servicioId),
          getLotesServicio(servicioId),
          getResultadosServicio({ servicioId }),
        ]);
        if (cancelled) return;
        const servicioData = await sincronizarEstadoServicio(servicioDataRaw);
        if (cancelled) return;
        setServicio(servicioData);
        setLotes(lotesData);
        setResultados(resultadosData);
        setStatus("ready");
        void fetchVacas(lotesData.vientres);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) {
          setStatus("not-found");
          return;
        }
        setErrorMessage(
          error instanceof ApiError
            ? error.detail
            : "No se pudo cargar el detalle del servicio.",
        );
        setStatus("error");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [servicioId]);

  const startEditing = () => {
    if (!servicio) return;
    setEditValues({
      nombre: servicio.nombre,
      fecha_inicio: servicio.fecha_inicio,
      fecha_fin: servicio.fecha_fin ?? "",
      estado: servicio.estado,
      observaciones: servicio.observaciones,
    });
    setEditErrors({});
    setEditFormError("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditValues(null);
    setEditErrors({});
    setEditFormError("");
  };

  const updateEditField =
    (field: keyof ServicioEditarValues) =>
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      setEditValues((current) =>
        current ? { ...current, [field]: event.target.value } : current,
      );
      setEditErrors((current) => ({ ...current, [field]: undefined }));
      setEditFormError("");
    };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving || !editValues || !servicio) return;

    const nextErrors = validateServicioEditarForm(editValues);
    setEditErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    try {
      const actualizado = await actualizarServicio(servicio.id, {
        nombre: editValues.nombre.trim(),
        fecha_inicio: editValues.fecha_inicio,
        fecha_fin: editValues.fecha_fin ? editValues.fecha_fin : null,
        estado: editValues.estado as EstadoServicio,
        observaciones: editValues.observaciones.trim(),
      });
      setServicio(actualizado);
      toast.success("Servicio actualizado correctamente.");
      setIsEditing(false);
      setEditValues(null);
    } catch (error) {
      if (error instanceof ApiError) {
        setEditFormError(
          normalizeBackendDetail(error.detail) ??
            "Error al actualizar el servicio.",
        );
      } else {
        setEditFormError("No se pudo actualizar el servicio. Probá nuevamente.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const lotesAsociadosIds = new Set(
    [...(lotes?.vientres ?? []), ...(lotes?.toros ?? [])].map((l) => l.id),
  );
  const lotesDisponibles = todosLosLotes.filter(
    (l) => !lotesAsociadosIds.has(l.id),
  );

  const refetchLotes = async () => {
    if (!servicio) return;
    const nuevo = await getLotesServicio(servicio.id);
    setLotes(nuevo);
    void fetchVacas(nuevo.vientres);
  };

  const handleAgregarResultado = async (animalId: number) => {
    if (!servicio) return;
    setAnimalIdRegistrando(animalId);
    try {
      const nuevoResultado = await crearResultadoServicio({
        servicio_id: servicio.id,
        animal_id: animalId,
        estado: "PARIDA",
        fecha_diagnostico: localNaiveNow().slice(0, 10),
      });
      setResultados((current) => [...current, nuevoResultado]);
      toast.success("Se registró que tuvo un ternero.");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? normalizeBackendDetail(error.detail)
          : "No se pudo registrar el resultado.",
      );
    } finally {
      setAnimalIdRegistrando(null);
    }
  };

  const resultadosPorAnimalId = new Map(
    resultados.map((r) => [r.animal_id, r]),
  );

  const handleAgregarLote = async () => {
    if (!servicio || !loteIdParaAgregar) return;
    setIsAgregandoLote(true);
    try {
      await asociarLoteServicio(servicio.id, Number(loteIdParaAgregar));
      await refetchLotes();
      setLoteIdParaAgregar("");
      toast.success("Lote asociado al servicio.");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? normalizeBackendDetail(error.detail)
          : "No se pudo asociar el lote.",
      );
    } finally {
      setIsAgregandoLote(false);
    }
  };

  const handleQuitarLote = async (loteId: number) => {
    if (!servicio) return;
    setLoteIdQuitando(loteId);
    try {
      await desasociarLoteServicio(servicio.id, loteId);
      await refetchLotes();
      toast.success("Lote desasociado del servicio.");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? normalizeBackendDetail(error.detail)
          : "No se pudo desasociar el lote.",
      );
    } finally {
      setLoteIdQuitando(null);
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
          onClick={() => navigate("/servicios")}>
          <IconArrowLeft size={16} stroke={1.5} />
          Volver
        </Button>
      </div>

      {status === "loading" && <p>Cargando...</p>}

      {status === "not-found" && (
        <p className="status-message error" role="alert">
          El servicio ya no está disponible. Volvé al listado para consultar
          los servicios disponibles.
        </p>
      )}

      {status === "error" && (
        <p className="status-message error" role="alert">
          {errorMessage}
        </p>
      )}

      {status === "ready" && servicio && (
        <>
          <div className="animal-page__hero">
            <div>
              <span className="animal-page__eyebrow">Servicio</span>
              <h1>{servicio.nombre || `#${servicio.id}`}</h1>
            </div>
            <span
              className={`servicio-badge servicio-badge--${servicio.estado}`}>
              {ESTADO_SERVICIO_LABELS[servicio.estado] ?? servicio.estado}
            </span>
          </div>

          <Button
            colorPalette="brand"
            variant={"outline"}
            bg="var(--panel)"
            className="animal-page__details-toggle"
            aria-expanded={isDetailsOpen}
            disabled={isEditing}
            onClick={() => setIsDetailsOpen((current) => !current)}>
            <IconChevronDown
              size={16}
              stroke={1.75}
              className={`animal-page__details-toggle-icon${
                isDetailsOpen ? " animal-page__details-toggle-icon--open" : ""
              }`}
            />
            {isDetailsOpen ? "Ocultar detalles" : "Mostrar detalles"}
          </Button>

          <div
            className={`animal-page__grid-collapse${
              isDetailsOpen ? " animal-page__grid-collapse--open" : ""
            }`}>
            <div className="animal-page__grid-collapse-inner">
              <div className="animal-page__grid-wrapper">
                {isEditing && editValues ? (
                  <form
                    onSubmit={handleSave}
                    noValidate
                    className="animal-edit-page__form">
                    {editFormError && (
                      <p
                        className="status-message error animal-edit-page__field--full"
                        role="alert">
                        {editFormError}
                      </p>
                    )}

                    <Field.Root invalid={!!editErrors.nombre}>
                      <Field.Label>Nombre</Field.Label>
                      <Input
                        value={editValues.nombre}
                        onChange={updateEditField("nombre")}
                      />
                      <Field.ErrorText>{editErrors.nombre}</Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={!!editErrors.estado}>
                      <Field.Label>Estado</Field.Label>
                      <NativeSelect.Root>
                        <NativeSelect.Field
                          value={editValues.estado}
                          onChange={updateEditField("estado")}>
                          {ESTADOS_SERVICIO.map(({ value, label }) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                      <Field.ErrorText>{editErrors.estado}</Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={!!editErrors.fecha_inicio}>
                      <Field.Label>Fecha de inicio</Field.Label>
                      <Input
                        type="date"
                        value={editValues.fecha_inicio}
                        onChange={updateEditField("fecha_inicio")}
                      />
                      <Field.ErrorText>
                        {editErrors.fecha_inicio}
                      </Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={!!editErrors.fecha_fin}>
                      <Field.Label>Fecha de fin</Field.Label>
                      <Input
                        type="date"
                        value={editValues.fecha_fin}
                        onChange={updateEditField("fecha_fin")}
                      />
                      <Field.ErrorText>{editErrors.fecha_fin}</Field.ErrorText>
                    </Field.Root>

                    <Field.Root className="animal-edit-page__field--full">
                      <Field.Label>Observaciones</Field.Label>
                      <Textarea
                        value={editValues.observaciones}
                        onChange={updateEditField("observaciones")}
                        rows={3}
                      />
                    </Field.Root>

                    <div className="animal-edit-page__actions">
                      <Button
                        type="button"
                        variant="outline"
                        className="animal-form__cancel"
                        onClick={cancelEditing}
                        disabled={isSaving}>
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        colorPalette="brand"
                        loading={isSaving}
                        loadingText="Guardando...">
                        Guardar cambios
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <dl className="animal-page__grid">
                      {CAMPOS.map(({ label, render }) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{render(servicio)}</dd>
                        </div>
                      ))}
                      <div className="animal-page__grid-field--full">
                        <dt>{CAMPO_OBSERVACIONES.label}</dt>
                        <dd>{CAMPO_OBSERVACIONES.render(servicio)}</dd>
                      </div>
                    </dl>

                    <div className="animal-page__grid-actions">
                      <button
                        type="button"
                        className="animal-detail__action"
                        onClick={startEditing}>
                        <IconEdit size={16} stroke={1.5} />
                        Editar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="animal-page__details-divider" />

          <section className="animal-detail__section">
            <div className="animal-detail__section-header">
              <div>
                <span className="animal-detail__section-eyebrow">
                  Lotes asociados
                </span>
                <h2>Vientres y toros</h2>
              </div>
              <Badge colorPalette="brand">
                {resultados.length} resultado{resultados.length === 1 ? "" : "s"}
              </Badge>
            </div>

            {isEditing && (
              <div className="servicio-detail__agregar-lote">
                <NativeSelect.Root size="sm" flex="1" minW="220px">
                  <NativeSelect.Field
                    value={loteIdParaAgregar}
                    onChange={(event) =>
                      setLoteIdParaAgregar(event.target.value)
                    }>
                    <option value="">
                      {lotesDisponibles.length === 0
                        ? "No hay lotes disponibles para asociar"
                        : "Seleccioná un lote para agregar"}
                    </option>
                    {lotesDisponibles.map((lote) => (
                      <option key={lote.id} value={lote.id}>
                        {lote.nombre} ·{" "}
                        {CATEGORIA_ANIMAL_LABELS[lote.categoria] ?? lote.categoria}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
                <Button
                  colorPalette="brand"
                  size="sm"
                  disabled={!loteIdParaAgregar}
                  loading={isAgregandoLote}
                  onClick={handleAgregarLote}>
                  Agregar
                </Button>
              </div>
            )}

            <div className="servicio-detail__lotes">
              <VientresGrupo
                lotes={lotes?.vientres ?? []}
                isEditing={isEditing}
                loteIdQuitando={loteIdQuitando}
                onQuitar={handleQuitarLote}
                animalesPorLoteId={animalesPorLoteId}
                loadingVacas={loadingVacas}
                resultadosPorAnimalId={resultadosPorAnimalId}
                animalIdRegistrando={animalIdRegistrando}
                onAgregarResultado={handleAgregarResultado}
              />
              <LotesGrupo
                titulo="Toros"
                lotes={lotes?.toros ?? []}
                isEditing={isEditing}
                loteIdQuitando={loteIdQuitando}
                onQuitar={handleQuitarLote}
              />
            </div>
          </section>
        </>
      )}
    </section>
  );
}

type LotesGrupoProps = {
  titulo: string;
  lotes: ServicioLotesAgrupados["vientres"];
  isEditing: boolean;
  loteIdQuitando: number | null;
  onQuitar: (loteId: number) => void;
};

function LotesGrupo({
  titulo,
  lotes,
  isEditing,
  loteIdQuitando,
  onQuitar,
}: LotesGrupoProps) {
  return (
    <div className="servicio-detail__lotes-grupo">
      <div className="servicio-detail__lotes-grupo-header">
        <h2>{titulo}</h2>
        <Badge colorPalette="brand">{lotes.length}</Badge>
      </div>
      {lotes.length === 0 ? (
        <p className="servicio-detail__lotes-vacio">
          No hay lotes de {titulo.toLowerCase()} asociados a este servicio.
        </p>
      ) : (
        <ul className="servicio-detail__lotes-lista">
          {lotes.map((lote) => (
            <li key={lote.id} className="servicio-detail__lote-item">
              <span>{lote.nombre}</span>
              <span className="servicio-detail__lote-categoria">
                {CATEGORIA_ANIMAL_LABELS[lote.categoria] ?? lote.categoria}
              </span>
              {isEditing && (
                <button
                  type="button"
                  className="servicio-detail__lote-quitar"
                  aria-label={`Quitar ${lote.nombre} del servicio`}
                  disabled={loteIdQuitando === lote.id}
                  onClick={() => onQuitar(lote.id)}>
                  <IconX size={14} stroke={2} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type VientresGrupoProps = {
  lotes: ServicioLotesAgrupados["vientres"];
  isEditing: boolean;
  loteIdQuitando: number | null;
  onQuitar: (loteId: number) => void;
  animalesPorLoteId: Map<number, Animal[]>;
  loadingVacas: boolean;
  resultadosPorAnimalId: Map<number, ResultadoServicioRead>;
  animalIdRegistrando: number | null;
  onAgregarResultado: (animalId: number) => void;
};

function VientresGrupo({
  lotes,
  isEditing,
  loteIdQuitando,
  onQuitar,
  animalesPorLoteId,
  loadingVacas,
  resultadosPorAnimalId,
  animalIdRegistrando,
  onAgregarResultado,
}: VientresGrupoProps) {
  return (
    <div className="servicio-detail__lotes-grupo">
      <div className="servicio-detail__lotes-grupo-header">
        <h2>Vientres</h2>
        <Badge colorPalette="brand">{lotes.length}</Badge>
      </div>
      {lotes.length === 0 ? (
        <p className="servicio-detail__lotes-vacio">
          No hay lotes de vientres asociados a este servicio.
        </p>
      ) : (
        <ul className="servicio-detail__lotes-lista">
          {lotes.map((lote) => {
            const vacas = animalesPorLoteId.get(lote.id) ?? [];
            return (
              <li key={lote.id} className="servicio-detail__vientre-lote">
                <div className="servicio-detail__lote-item">
                  <span>{lote.nombre}</span>
                  <span className="servicio-detail__lote-categoria">
                    {CATEGORIA_ANIMAL_LABELS[lote.categoria] ?? lote.categoria}
                  </span>
                  {isEditing && (
                    <button
                      type="button"
                      className="servicio-detail__lote-quitar"
                      aria-label={`Quitar ${lote.nombre} del servicio`}
                      disabled={loteIdQuitando === lote.id}
                      onClick={() => onQuitar(lote.id)}>
                      <IconX size={14} stroke={2} />
                    </button>
                  )}
                </div>

                {loadingVacas ? (
                  <p className="servicio-detail__vacas-vacio">
                    Cargando vacas...
                  </p>
                ) : vacas.length === 0 ? (
                  <p className="servicio-detail__vacas-vacio">
                    Este lote no tiene animales.
                  </p>
                ) : (
                  <ul className="servicio-detail__vacas-lista">
                    {vacas.map((vaca) => {
                      const resultado = resultadosPorAnimalId.get(vaca.id);
                      return (
                        <li key={vaca.id} className="servicio-detail__vaca-item">
                          <span>{vaca.caravana ?? `#${vaca.id}`}</span>
                          {resultado ? (
                            <span
                              className={`resultado-badge resultado-badge--${resultado.estado}`}>
                              {ESTADO_RESULTADO_SERVICIO_LABELS[
                                resultado.estado
                              ] ?? resultado.estado}
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="servicio-detail__agregar-resultado-btn"
                              disabled={animalIdRegistrando === vaca.id}
                              onClick={() => onAgregarResultado(vaca.id)}>
                              Agregar resultado
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
