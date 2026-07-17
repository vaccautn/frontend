import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Badge, Button } from "@chakra-ui/react";
import {
  IconArrowLeft,
  IconChevronDown,
  IconEdit,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import type { Animal, EvaluacionCC } from "@/features/animales/types";
import {
  getAnimal,
  getEvaluacionesCc,
} from "@/features/animales/services/animalesService";
import { formatFecha } from "@/features/animales/utils/formatDate";
import { EvaluacionCCItem } from "./EvaluacionCCItem";
import { RegistrarEvaluacionCCDialog } from "./RegistrarEvaluacionCCDialog";
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogInstanceKey, setDialogInstanceKey] = useState(0);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);

  const latestEvaluacionesRequestId = useRef(0);

  const canRegisterEvaluation = animal?.estado === "ACTIVO";
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
      const history = await getEvaluacionesCc(animalId);

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

  const openEvaluacionDialog = () => {
    setDialogInstanceKey((current) => current + 1);
    setIsDialogOpen(true);
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
        <button
          type="button"
          className="animal-page__back-btn"
          onClick={() => navigate("/animales")}>
          <IconArrowLeft size={16} stroke={1.5} />
          Volver
        </button>
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

          <button
            type="button"
            className="animal-page__details-toggle"
            aria-expanded={isDetailsOpen}
            onClick={() => setIsDetailsOpen((current) => !current)}>
            <IconChevronDown
              size={16}
              stroke={1.75}
              className={`animal-page__details-toggle-icon${
                isDetailsOpen ? " animal-page__details-toggle-icon--open" : ""
              }`}
            />
            {isDetailsOpen ? "Ocultar detalles" : "Mostrar detalles"}
          </button>

          {isDetailsOpen && (
            <div className="animal-page__grid-wrapper">
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
                  onClick={() => navigate(`/animales/${animal.id}/editar`)}>
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
            </div>
          )}

          <section className="animal-detail__section">
            <div className="animal-detail__section-header">
              <div>
                <span className="animal-detail__section-eyebrow">
                  Condición corporal
                </span>
                <h2>Historial de evaluaciones</h2>
              </div>

              <span
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
              </span>
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

      <RegistrarEvaluacionCCDialog
        key={`${animal?.id ?? "sin-animal"}-${dialogInstanceKey}`}
        animal={animal}
        open={isDialogOpen && !!animal}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={handleRefreshEvaluaciones}
      />

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
