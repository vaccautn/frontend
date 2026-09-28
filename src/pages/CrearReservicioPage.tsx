import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Field,
  Input,
  NativeSelect,
  Textarea,
} from "@chakra-ui/react";
import { IconArrowLeft } from "@tabler/icons-react";
import { toast } from "react-toastify";
import {
  crearReservicio,
  getParticipantesServicio,
  getServicio,
} from "@/features/servicios/services/serviciosService";
import type {
  ParticipanteServicio,
  ServicioRead,
} from "@/features/servicios/types";
import {
  validateServicioNuevoForm,
  type ServicioNuevoFieldErrors,
} from "@/features/servicios/utils/serviciosValidation";
import {
  CATEGORIA_ANIMAL_LABELS,
  CATEGORIAS_POR_SEXO,
} from "@/features/animales/constants";
import type { CategoriaAnimal } from "@/features/animales/types";
import { normalizeBackendDetail } from "@/features/auth";
import { ApiError } from "@/services/httpClient";
import "@/features/animales/components/animales.css";
import "@/features/servicios/components/servicios.css";

type FormValues = {
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  observaciones: string;
  lote_nombre: string;
  lote_categoria: string;
};

type FormErrors = ServicioNuevoFieldErrors & {
  lote_nombre?: string;
  lote_categoria?: string;
  vacas?: string;
};

const VALORES_INICIALES: FormValues = {
  nombre: "",
  fecha_inicio: "",
  fecha_fin: "",
  observaciones: "",
  lote_nombre: "",
  lote_categoria: "",
};

type PageStatus = "loading" | "ready" | "error" | "not-found";

/** Vacas que pueden ir al reservicio: vacías, activas y sin otro reservicio. */
function esElegible(participante: ParticipanteServicio): boolean {
  return (
    participante.resultado.estado === "VACIA" &&
    participante.animal.estado === "ACTIVO" &&
    participante.reservicio_id === null
  );
}

export function CrearReservicioPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const servicioId = Number(id);

  const [status, setStatus] = useState<PageStatus>("loading");
  const [servicio, setServicio] = useState<ServicioRead | null>(null);
  const [elegibles, setElegibles] = useState<ParticipanteServicio[]>([]);
  const [seleccionadas, setSeleccionadas] = useState<Set<number>>(new Set());
  const [values, setValues] = useState<FormValues>(VALORES_INICIALES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(async () => {
      if (!Number.isInteger(servicioId) || servicioId <= 0) {
        if (!cancelled) setStatus("not-found");
        return;
      }
      try {
        const servicioData = await getServicio(servicioId);
        const participantes = await getParticipantesServicio(servicioId);
        if (cancelled) return;
        setServicio(servicioData);
        setElegibles(participantes.filter(esElegible));
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        setStatus(
          error instanceof ApiError && error.status === 404
            ? "not-found"
            : "error",
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [servicioId]);

  const volverAlServicio = () => navigate(`/servicios/${servicioId}`);

  const updateField =
    (field: keyof FormValues) =>
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
      setFormError("");
    };

  const toggleVaca = (animalId: number) => {
    setSeleccionadas((current) => {
      const siguiente = new Set(current);
      if (siguiente.has(animalId)) siguiente.delete(animalId);
      else siguiente.add(animalId);
      return siguiente;
    });
    setErrors((current) => ({ ...current, vacas: undefined }));
    setFormError("");
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const nextErrors: FormErrors = validateServicioNuevoForm(values);
    if (!values.lote_nombre.trim()) {
      nextErrors.lote_nombre = "El nombre del lote es obligatorio.";
    }
    if (!values.lote_categoria) {
      nextErrors.lote_categoria = "Elegí la categoría del lote.";
    }
    if (seleccionadas.size === 0) {
      nextErrors.vacas = "Elegí al menos una vaca para el reservicio.";
    }
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setIsSubmitting(true);
    try {
      const reservicio = await crearReservicio(servicioId, {
        nombre: values.nombre.trim(),
        fecha_inicio: values.fecha_inicio,
        fecha_fin: values.fecha_fin,
        observaciones: values.observaciones.trim(),
        lote: {
          nombre: values.lote_nombre.trim(),
          categoria: values.lote_categoria as CategoriaAnimal,
        },
        animal_ids: [...seleccionadas],
      });
      toast.success("Reservicio creado correctamente.");
      navigate(`/servicios/${reservicio.id}`);
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? (normalizeBackendDetail(error.detail) ??
              "No se pudo crear el reservicio.")
          : "No se pudo crear el reservicio. Probá nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const motivoNoDisponible = !servicio
    ? ""
    : servicio.servicio_origen_id !== null
      ? "Un reservicio no puede tener su propio reservicio."
      : servicio.estado !== "FINALIZADO"
        ? "Solo se puede iniciar un reservicio desde un servicio finalizado."
        : "";

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
          No se pudieron cargar las vacas del servicio.
        </p>
      )}
      {status === "ready" && motivoNoDisponible && (
        <p className="status-message error" role="alert">
          {motivoNoDisponible}
        </p>
      )}

      {status === "ready" && servicio && !motivoNoDisponible && (
        <>
          <div className="animal-page__hero">
            <div>
              <span className="animal-page__eyebrow">
                Reservicio de {servicio.nombre || `Servicio #${servicio.id}`}
              </span>
              <h1>Iniciar reservicio</h1>
            </div>
          </div>

          <div className="animal-edit-page__form">
            <Field.Root>
              <Field.Label>Nombre del reservicio</Field.Label>
              <Input
                value={values.nombre}
                onChange={updateField("nombre")}
                placeholder="Ej.: Otoño 2027"
              />
            </Field.Root>
            <div />

            <Field.Root invalid={!!errors.fecha_inicio}>
              <Field.Label>Fecha de inicio</Field.Label>
              <Input
                type="date"
                value={values.fecha_inicio}
                onChange={updateField("fecha_inicio")}
              />
              <Field.ErrorText>{errors.fecha_inicio}</Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!errors.fecha_fin}>
              <Field.Label>Fecha de fin</Field.Label>
              <Input
                type="date"
                value={values.fecha_fin}
                onChange={updateField("fecha_fin")}
              />
              <Field.ErrorText>{errors.fecha_fin}</Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!errors.lote_nombre}>
              <Field.Label>Nombre del lote nuevo</Field.Label>
              <Input
                value={values.lote_nombre}
                onChange={updateField("lote_nombre")}
                placeholder="Ej.: Vacías otoño 2027"
              />
              <Field.ErrorText>{errors.lote_nombre}</Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!errors.lote_categoria}>
              <Field.Label>Categoría del lote</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={values.lote_categoria}
                  onChange={updateField("lote_categoria")}>
                  <option value="">Seleccioná la categoría</option>
                  {CATEGORIAS_POR_SEXO.HEMBRA.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {CATEGORIA_ANIMAL_LABELS[categoria] ?? categoria}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
              <Field.ErrorText>{errors.lote_categoria}</Field.ErrorText>
            </Field.Root>

            <Field.Root className="animal-edit-page__field--full">
              <Field.Label>Observaciones</Field.Label>
              <Textarea
                value={values.observaciones}
                onChange={updateField("observaciones")}
                rows={2}
              />
            </Field.Root>
          </div>

          <div className="animal-detail__section-header">
            <div>
              <span className="animal-detail__section-eyebrow">
                Vacas vacías
              </span>
              <h2>Elegí las vacas que entran al reservicio</h2>
            </div>
            <span className="cargar-resultados__resumen">
              {seleccionadas.size} de {elegibles.length} seleccionada
              {elegibles.length === 1 ? "" : "s"}
            </span>
          </div>

          {elegibles.length === 0 ? (
            <p className="servicio-detail__lotes-vacio">
              No hay vacas vacías disponibles: todas están en otro reservicio o
              ya no están activas.
            </p>
          ) : (
            <ul className="cargar-resultados__lista">
              {elegibles.map(({ animal, lote_actual }) => (
                <li key={animal.id} className="cargar-resultados__fila">
                  <label className="reservicio__vaca">
                    <input
                      type="checkbox"
                      checked={seleccionadas.has(animal.id)}
                      onChange={() => toggleVaca(animal.id)}
                    />
                    <strong>{animal.caravana ?? `#${animal.id}`}</strong>
                    <span>{lote_actual?.nombre ?? "Sin lote"}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          {errors.vacas && (
            <p className="cargar-resultados__error">{errors.vacas}</p>
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
              disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              colorPalette="brand"
              onClick={handleSubmit}
              loading={isSubmitting}
              loadingText="Creando..."
              disabled={elegibles.length === 0}>
              Crear reservicio
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
