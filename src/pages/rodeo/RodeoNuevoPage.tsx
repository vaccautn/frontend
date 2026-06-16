import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { registerAnimal } from "@/features/rodeo/services/rodeoService";
import { ApiError } from "@/services/httpClient";
import {
  initialRodeoNuevoValues,
  validateRodeoNuevoForm,
  type RodeoNuevoFieldErrors,
  type RodeoNuevoValues,
} from "@/features/rodeo/utils/rodeoValidation";
import { normalizeBackendDetail } from "@/features/auth";

// TODO: confirmar si las razas vienen de la API
const RAZAS = ["Angus", "Hereford", "Braford", "Brahman", "Holando", "Otra"];
const SEXOS = [
  { value: "MACHO", label: "Macho" },
  { value: "HEMBRA", label: "Hembra" },
];

function RodeoNuevoPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<RodeoNuevoValues>(
    initialRodeoNuevoValues,
  );
  const [errors, setErrors] = useState<RodeoNuevoFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField =
    (field: keyof RodeoNuevoValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
      setFormError("");
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;

    const nextErrors = validateRodeoNuevoForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      await registerAnimal({
        caravana: values.caravana.trim(),
        raza: values.raza,
        sexo: values.sexo,
        fecha_nacimiento: values.fecha_nacimiento,
        lote_id: null,
      });
      navigate("/rodeo");
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(
          normalizeBackendDetail(error.detail) ??
            "Error al registrar el animal.",
        );
      } else {
        setFormError("No se pudo registrar el animal. Probá nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      <h2>Registrar animal</h2>

      {formError && (
        <p className="status-message error" role="alert">
          {formError}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="id-caravana">Caravana</label>

          <input
            id="caravana"
            name="caravana"
            type="text"
            value={values.caravana}
            onChange={updateField("caravana")}
          />

          {errors.caravana && (
            <span id="id-caravana-error" className="field-error">
              {errors.caravana}
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor="raza">Raza</label>
          <select
            id="raza"
            name="raza"
            value={values.raza}
            onChange={updateField("raza")}
            aria-describedby={errors.raza ? "raza-error" : undefined}>
            <option value="">Seleccioná una raza</option>
            {RAZAS.map((raza) => (
              <option key={raza} value={raza}>
                {raza}
              </option>
            ))}
          </select>
          {errors.raza && (
            <span id="raza-error" className="field-error">
              {errors.raza}
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor="sexo">Sexo</label>
          <select
            id="sexo"
            name="sexo"
            value={values.sexo}
            onChange={updateField("sexo")}
            aria-describedby={errors.sexo ? "sexo-error" : undefined}>
            <option value="">Seleccioná el sexo</option>
            {SEXOS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.sexo && (
            <span id="sexo-error" className="field-error">
              {errors.sexo}
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor="fecha-nacimiento">Fecha de nacimiento</label>
          <input
            id="fecha-nacimiento"
            name="fecha_nacimiento"
            type="date"
            value={values.fecha_nacimiento}
            onChange={updateField("fecha_nacimiento")}
            aria-describedby={
              errors.fecha_nacimiento ? "fecha-nacimiento-error" : undefined
            }
          />
          {errors.fecha_nacimiento && (
            <span id="fecha-nacimiento-error" className="field-error">
              {errors.fecha_nacimiento}
            </span>
          )}
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate("/rodeo")}>
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Registrando..." : "Registrar animal"}
          </button>
        </div>
      </form>
    </main>
  );
}

export default RodeoNuevoPage;
