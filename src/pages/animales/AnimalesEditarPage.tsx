import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Button, Field, Input, NativeSelect, Textarea } from "@chakra-ui/react";
import { IconArrowLeft } from "@tabler/icons-react";
import { ApiError } from "@/services/httpClient";
import "./animales.css";
import {
  getAnimal,
  updateAnimal,
} from "@/features/animales/services/animalesService";
import {
  validateRodeoEditarForm,
  type RodeoEditarFieldErrors,
  type RodeoEditarValues,
} from "@/features/animales/utils/animalesValidation";
import { normalizeBackendDetail } from "@/features/auth";
import type { EstadoAnimal } from "@/features/animales/types";

const RAZAS = [
  "Angus",
  "Hereford",
  "Brangus",
  "Brahman",
  "Limousin",
  "Simmental",
  "Shorthorn",
  "Charolais",
  "Criolla",
  "Otro",
];
const SEXOS = [
  { value: "MACHO", label: "Macho" },
  { value: "HEMBRA", label: "Hembra" },
];
const ESTADOS = [
  { value: "ACTIVO", label: "Activo" },
  { value: "VENDIDO", label: "Vendido" },
  { value: "MUERTO", label: "Muerto" },
];

function RodeoEditarPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [values, setValues] = useState<RodeoEditarValues | null>(null);
  const [errors, setErrors] = useState<RodeoEditarFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getAnimal(Number(id)).then((animal) => {
      setValues({
        caravana: animal.caravana ?? "",
        raza: animal.raza,
        sexo: animal.sexo,
        fecha_nacimiento: animal.fecha_nacimiento ?? "",
        estado: animal.estado,
        observacion: animal.observacion ?? "",
        lote_id: animal.lote_id?.toString() ?? "",
      });
    });
  }, [id]);

  const close = (refresh = false) => {
    const shouldRefresh = typeof refresh === "boolean" ? refresh : false;
    if (!id) {
      navigate("/animales");
      return;
    }
    navigate(`/animales/${id}`, { state: { refresh: shouldRefresh } });
  };

  const updateField =
    (field: keyof RodeoEditarValues) =>
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      setValues((current) =>
        current ? { ...current, [field]: event.target.value } : current,
      );
      setErrors((current) => ({ ...current, [field]: undefined }));
      setFormError("");
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || !values) return;

    const nextErrors = validateRodeoEditarForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await updateAnimal(Number(id), {
        caravana: values.caravana.trim(),
        raza: values.raza,
        sexo: values.sexo,
        fecha_nacimiento: values.fecha_nacimiento,
        estado: values.estado as EstadoAnimal,
        observacion: values.observacion.trim(),
        lote_id: values.lote_id ? Number(values.lote_id) : null,
      });
      toast.success("Animal actualizado correctamente.");
      close(true);
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(
          normalizeBackendDetail(error.detail) ??
            "Error al actualizar el animal.",
        );
      } else {
        setFormError("No se pudo actualizar el animal. Probá nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!values) return null;

  return (
    <section className="animal-page">
      <div className="animal-page__topbar">
        <button
          type="button"
          className="animal-page__back-btn"
          onClick={() => close()}>
          <IconArrowLeft size={16} stroke={1.5} />
          Volver al animal
        </button>
      </div>

      <div className="animal-page__hero">
        <div>
          <span className="animal-page__eyebrow">Animal</span>
          <h1>Editar {values.caravana || `#${id}`}</h1>
        </div>
      </div>

      {formError && (
        <p className="status-message error" role="alert">
          {formError}
        </p>
      )}

      <form
        id="animal-editar-form"
        onSubmit={handleSubmit}
        noValidate
        className="animal-edit-page__form">
        <Field.Root invalid={!!errors.caravana}>
          <Field.Label>Caravana</Field.Label>
          <Input value={values.caravana} onChange={updateField("caravana")} />
          <Field.ErrorText>{errors.caravana}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.raza}>
          <Field.Label>Raza</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field value={values.raza} onChange={updateField("raza")}>
              <option value="">Seleccioná una raza</option>
              {RAZAS.map((raza) => (
                <option key={raza} value={raza}>
                  {raza}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          <Field.ErrorText>{errors.raza}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.sexo}>
          <Field.Label>Sexo</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field value={values.sexo} onChange={updateField("sexo")}>
              <option value="">Seleccioná el sexo</option>
              {SEXOS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          <Field.ErrorText>{errors.sexo}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.fecha_nacimiento}>
          <Field.Label>Fecha de nacimiento</Field.Label>
          <Input
            type="date"
            value={values.fecha_nacimiento}
            max={new Date().toISOString().split("T")[0]}
            onChange={updateField("fecha_nacimiento")}
          />
          <Field.ErrorText>{errors.fecha_nacimiento}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.estado}>
          <Field.Label>Estado</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field value={values.estado} onChange={updateField("estado")}>
              <option value="">Seleccioná el estado</option>
              {ESTADOS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          <Field.ErrorText>{errors.estado}</Field.ErrorText>
        </Field.Root>

        <Field.Root className="animal-edit-page__field--full">
          <Field.Label>Observación</Field.Label>
          <Textarea
            value={values.observacion}
            onChange={updateField("observacion")}
            rows={3}
          />
        </Field.Root>

        <Field.Root className="animal-edit-page__field--full">
          <Field.Label>Lote</Field.Label>
          <Input
            type="number"
            min={1}
            value={values.lote_id}
            onChange={updateField("lote_id")}
          />
        </Field.Root>

        <div className="animal-edit-page__actions">
          <Button
            type="button"
            variant="outline"
            className="animal-form__cancel"
            onClick={() => close()}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="animal-editar-form"
            colorPalette="brand"
            loading={isSubmitting}
            loadingText="Guardando...">
            Guardar cambios
          </Button>
        </div>
      </form>
    </section>
  );
}

export default RodeoEditarPage;
