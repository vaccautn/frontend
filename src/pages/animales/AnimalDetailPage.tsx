import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Badge,
  Button,
  Field,
  Input,
  NativeSelect,
  Textarea,
} from "@chakra-ui/react";
import { toast } from "react-toastify";
import {
  IconArrowLeft,
  IconChevronDown,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import type {
  Animal,
  EstadoAnimal,
  EvaluacionCC,
} from "@/features/animales/types";
import {
  getAnimal,
  getEvaluacionesCc,
  updateAnimal,
} from "@/features/animales/services/animalesService";
import { useAnimalDashboard } from "@/features/animales/hooks/useAnimalDashboard";
import { AnimalDashboard } from "@/features/animales/components/dashboard/AnimalDashboard";
import { formatFecha } from "@/features/animales/utils/formatDate";
import { RAZAS, SEXOS, ESTADOS_FILTRO } from "@/features/animales/constants";
import {
  validateRodeoEditarForm,
  type RodeoEditarFieldErrors,
  type RodeoEditarValues,
} from "@/features/animales/utils/animalesValidation";
import { normalizeBackendDetail } from "@/features/auth";
import { ApiError } from "@/services/httpClient";
import { EvaluacionCCItem } from "./EvaluacionCCItem";

import { BajaAnimalModal } from "./BajaAnimalModal";
import "./animales.css";

const CAMPOS: { label: string; render: (animal: Animal) => string }[] = [
  {
    label: "Fecha de nacimiento",
    render: (a) => (a.fecha_nacimiento ? formatFecha(a.fecha_nacimiento) : "—"),
  },
  { label: "Raza", render: (a) => a.raza },
  { label: "Sexo", render: (a) => a.sexo },
];

const CAMPO_OBSERVACION = {
  label: "Observación",
  render: (animal: Animal) => animal.observacion || "—",
};

export function AnimalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [animalLoading, setAnimalLoading] = useState(true);
  const [animalError, setAnimalError] = useState("");
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionCC[]>([]);
  const [evaluacionesLoading, setEvaluacionesLoading] = useState(false);
  const [evaluacionesError, setEvaluacionesError] = useState("");
  const [animalParaBaja, setAnimalParaBaja] = useState<Animal | null>(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editValues, setEditValues] = useState<RodeoEditarValues | null>(null);
  const [editErrors, setEditErrors] = useState<RodeoEditarFieldErrors>({});
  const [editFormError, setEditFormError] = useState("");
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const latestEvaluacionesRequestId = useRef(0);

  const animalId = Number(id);
  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
    // refetch: refetchDashboard,
  } = useAnimalDashboard(animalId);

  const canStartBajaFlow = animal?.estado === "ACTIVO";

  const historyItems = useMemo(() => {
    return [...evaluaciones].sort((first, second) => {
      const secondDate = new Date(second.fecha).getTime();
      const firstDate = new Date(first.fecha).getTime();

      return secondDate - firstDate || second.id - first.id;
    });
  }, [evaluaciones]);

  const fetchAnimal = useCallback(async () => {
    setAnimalLoading(true);
    setAnimalError("");

    try {
      const data = await getAnimal(Number(id));
      setAnimal(data);
    } catch {
      setAnimalError("No se pudo cargar la información del animal.");
    } finally {
      setAnimalLoading(false);
    }
  }, [id]);

  const fetchEvaluaciones = useCallback(async (animalId: number) => {
    const requestId = ++latestEvaluacionesRequestId.current;
    setEvaluacionesLoading(true);
    setEvaluacionesError("");

    try {
      const history = await getEvaluacionesCc({ animalId });

      if (latestEvaluacionesRequestId.current !== requestId) return;

      setEvaluaciones(history);
    } catch {
      if (latestEvaluacionesRequestId.current !== requestId) return;

      setEvaluacionesError("No se pudo cargar el historial de evaluaciones.");
    } finally {
      if (latestEvaluacionesRequestId.current === requestId) {
        setEvaluacionesLoading(false);
      }
    }
  }, []);

  const handleRefreshEvaluaciones = useCallback(() => {
    if (!animal) return Promise.resolve();

    return fetchEvaluaciones(animal.id);
  }, [animal, fetchEvaluaciones]);

  const handleBajaSuccess = () => {
    navigate("/animales", { state: { refresh: true } });
  };

  const startEditingDetails = () => {
    if (!animal) return;

    setEditValues({
      caravana: animal.caravana ?? "",
      raza: animal.raza,
      sexo: animal.sexo,
      fecha_nacimiento: animal.fecha_nacimiento ?? "",
      estado: animal.estado,
      observacion: animal.observacion ?? "",
      lote_id: animal.lote_id?.toString() ?? "",
    });
    setEditErrors({});
    setEditFormError("");
    setIsEditingDetails(true);
  };

  const cancelEditingDetails = () => {
    setIsEditingDetails(false);
    setEditValues(null);
    setEditErrors({});
    setEditFormError("");
  };

  const updateEditField =
    (field: keyof RodeoEditarValues) =>
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

  const handleSaveDetails = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSavingDetails || !editValues || !animal) return;

    const nextErrors = validateRodeoEditarForm(editValues);
    setEditErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSavingDetails(true);
    try {
      const updated = await updateAnimal(animal.id, {
        caravana: editValues.caravana.trim(),
        raza: editValues.raza,
        sexo: editValues.sexo,
        fecha_nacimiento: editValues.fecha_nacimiento,
        estado: editValues.estado as EstadoAnimal,
        observacion: editValues.observacion.trim(),
        lote_id: editValues.lote_id ? Number(editValues.lote_id) : null,
      });
      setAnimal(updated);
      toast.success("Animal actualizado correctamente.");
      setIsEditingDetails(false);
      setEditValues(null);
    } catch (error) {
      if (error instanceof ApiError) {
        setEditFormError(
          normalizeBackendDetail(error.detail) ??
            "Error al actualizar el animal.",
        );
      } else {
        setEditFormError("No se pudo actualizar el animal. Probá nuevamente.");
      }
    } finally {
      setIsSavingDetails(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    void fetchAnimal();
    void fetchEvaluaciones(Number(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const state = location.state as { refresh?: boolean } | null;

    if (state?.refresh && animal) {
      void fetchAnimal();
      void fetchEvaluaciones(animal.id);
    }
    // intentionally omit fetchAnimal/fetchEvaluaciones from deps to avoid an
    // infinite loop — they are stable useCallback references
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

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
          onClick={() => navigate("/animales")}>
          <IconArrowLeft size={16} stroke={1.5} />
          Volver
        </Button>
      </div>

      {animalLoading && <p>Cargando...</p>}
      {animalError && (
        <p className="status-message error" role="alert">
          {animalError}
        </p>
      )}

      {animal && (
        <>
          <div className="animal-page__hero">
            <div>
              <span className="animal-page__eyebrow">Animal</span>
              <h1>{animal.caravana ?? `#${animal.id}`}</h1>
            </div>
            <Badge colorPalette="brand" className="animal-detail__badge">
              {animal.estado}
            </Badge>
          </div>

          <Button
            colorPalette="brand"
            variant={"outline"}
            bg="var(--panel)"
            className="animal-page__details-toggle"
            aria-expanded={isDetailsOpen}
            disabled={isEditingDetails}
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
                {isEditingDetails && editValues ? (
                  <form
                    onSubmit={handleSaveDetails}
                    noValidate
                    className="animal-edit-page__form">
                    {editFormError && (
                      <p
                        className="status-message error animal-edit-page__field--full"
                        role="alert">
                        {editFormError}
                      </p>
                    )}

                    <Field.Root invalid={!!editErrors.caravana}>
                      <Field.Label>Caravana</Field.Label>
                      <Input
                        value={editValues.caravana}
                        onChange={updateEditField("caravana")}
                      />
                      <Field.ErrorText>{editErrors.caravana}</Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={!!editErrors.raza}>
                      <Field.Label>Raza</Field.Label>
                      <NativeSelect.Root>
                        <NativeSelect.Field
                          value={editValues.raza}
                          onChange={updateEditField("raza")}>
                          <option value="">Seleccioná una raza</option>
                          {RAZAS.map((raza) => (
                            <option key={raza} value={raza}>
                              {raza}
                            </option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                      <Field.ErrorText>{editErrors.raza}</Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={!!editErrors.sexo}>
                      <Field.Label>Sexo</Field.Label>
                      <NativeSelect.Root>
                        <NativeSelect.Field
                          value={editValues.sexo}
                          onChange={updateEditField("sexo")}>
                          <option value="">Seleccioná el sexo</option>
                          {SEXOS.map(({ value, label }) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                      <Field.ErrorText>{editErrors.sexo}</Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={!!editErrors.fecha_nacimiento}>
                      <Field.Label>Fecha de nacimiento</Field.Label>
                      <Input
                        type="date"
                        value={editValues.fecha_nacimiento}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={updateEditField("fecha_nacimiento")}
                      />
                      <Field.ErrorText>
                        {editErrors.fecha_nacimiento}
                      </Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={!!editErrors.estado}>
                      <Field.Label>Estado</Field.Label>
                      <NativeSelect.Root>
                        <NativeSelect.Field
                          value={editValues.estado}
                          onChange={updateEditField("estado")}>
                          <option value="">Seleccioná el estado</option>
                          {ESTADOS_FILTRO.map(({ value, label }) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                      <Field.ErrorText>{editErrors.estado}</Field.ErrorText>
                    </Field.Root>

                    <Field.Root className="animal-edit-page__field--full">
                      <Field.Label>Observación</Field.Label>
                      <Textarea
                        value={editValues.observacion}
                        onChange={updateEditField("observacion")}
                        rows={3}
                      />
                    </Field.Root>

                    <Field.Root className="animal-edit-page__field--full">
                      <Field.Label>Lote</Field.Label>
                      <Input
                        type="number"
                        min={1}
                        value={editValues.lote_id}
                        onChange={updateEditField("lote_id")}
                      />
                    </Field.Root>

                    <div className="animal-edit-page__actions">
                      <Button
                        type="button"
                        variant="outline"
                        className="animal-form__cancel"
                        onClick={cancelEditingDetails}
                        disabled={isSavingDetails}>
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        colorPalette="brand"
                        loading={isSavingDetails}
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
                          <dd>{render(animal)}</dd>
                        </div>
                      ))}
                      <div className="animal-page__grid-field--full">
                        <dt>{CAMPO_OBSERVACION.label}</dt>
                        <dd>{CAMPO_OBSERVACION.render(animal)}</dd>
                      </div>
                    </dl>

                    <div className="animal-page__grid-actions">
                      <button
                        type="button"
                        className="animal-detail__action"
                        onClick={startEditingDetails}>
                        <IconEdit size={16} stroke={1.5} />
                        Editar
                      </button>
                      <span
                        className={`animal-detail__action-tooltip-target${
                          canStartBajaFlow
                            ? ""
                            : " animal-detail__action-tooltip-target--disabled"
                        }`}
                        title={
                          canStartBajaFlow
                            ? undefined
                            : "No es posible dar de baja o eliminar al animal porque ya no se encuentra activo."
                        }>
                        <button
                          type="button"
                          className="animal-detail__action animal-detail__action--danger"
                          onClick={() => setAnimalParaBaja(animal)}
                          disabled={!canStartBajaFlow}>
                          <IconTrash size={16} stroke={1.5} />
                          Eliminar
                        </button>
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="animal-page__details-divider" />

          <AnimalDashboard
            data={dashboardData}
            loading={dashboardLoading}
            error={dashboardError}
          />

          <section className="animal-detail__section">
            <div className="animal-detail__section-header">
              <div>
                <span className="animal-detail__section-eyebrow">
                  Condición corporal
                </span>
                <h2>Historial de evaluaciones</h2>
              </div>

              {/* <span
                title={
                  canRegisterEvaluation
                    ? undefined
                    : "No es posible registrar una evaluación porque el animal no se encuentra activo."
                }>
                <Button
                  colorPalette="brand"
                  onClick={openEvaluacionDialog}
                  disabled={!canRegisterEvaluation}>
                  <IconPlus size={18} stroke={1.5} />
                  Registrar evaluación de CC
                </Button>
              </span> */}
            </div>

            {evaluacionesLoading && <p>Cargando historial...</p>}

            {evaluacionesError && (
              <p className="status-message error" role="alert">
                {evaluacionesError}
              </p>
            )}

            {!evaluacionesLoading &&
              !evaluacionesError &&
              historyItems.length === 0 && (
                <p className="animal-detail__empty">
                  Este animal todavía no tiene evaluaciones registradas.
                </p>
              )}

            {!evaluacionesLoading &&
              !evaluacionesError &&
              historyItems.length > 0 && (
                <div className="animal-evaluaciones__list">
                  {historyItems.map((evaluacion) => (
                    <EvaluacionCCItem
                      key={evaluacion.id}
                      evaluacion={evaluacion}
                      onUpdated={handleRefreshEvaluaciones}
                    />
                  ))}
                </div>
              )}
          </section>
        </>
      )}

      {/* <RegistrarEvaluacionCCDialog
        key={`${animal?.id ?? "sin-animal"}`}
        animal={animal}
        open={isDialogOpen && !!animal}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={async () => {
          await handleRefreshEvaluaciones();
          refetchDashboard();
        }}
      /> */}

      {animalParaBaja && (
        <BajaAnimalModal
          animal={animalParaBaja}
          onClose={() => setAnimalParaBaja(null)}
          onSuccess={handleBajaSuccess}
        />
      )}
    </section>
  );
}
