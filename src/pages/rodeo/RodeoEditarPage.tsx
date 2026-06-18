import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ApiError } from "@/services/httpClient";
import {
  getAnimal,
  updateAnimal,
} from "@/features/rodeo/services/rodeoService";
import {
  validateRodeoNuevoForm,
  type RodeoNuevoFieldErrors,
  type RodeoNuevoValues,
} from "@/features/rodeo/utils/rodeoValidation";
import { normalizeBackendDetail } from "@/features/auth";

const RAZAS = ["Angus", "Hereford", "Braford", "Brahman", "Holando", "Otra"];
const SEXOS = [
  { value: "MACHO", label: "Macho" },
  { value: "HEMBRA", label: "Hembra" },
];

function RodeoEditarPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [values, setValues] = useState<RodeoNuevoValues | null>(null);
  const [errors, setErrors] = useState<RodeoNuevoFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getAnimal(Number(id)).then((animal) => {
      setValues({
        caravana: animal.caravana ?? "",
        raza: animal.raza,
        sexo: animal.sexo,
        fecha_nacimiento: animal.fecha_nacimiento ?? "",
      });
      requestAnimationFrame(() => setVisible(true));
    });
  }, [id]);

  const close = () => {
    setVisible(false);
    setTimeout(() => navigate("/rodeo"), 300);
  };

  const updateField =
    (field: keyof RodeoNuevoValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((current) =>
        current ? { ...current, [field]: event.target.value } : current,
      );
      setErrors((current) => ({ ...current, [field]: undefined }));
      setFormError("");
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || !values) return;

    const nextErrors = validateRodeoNuevoForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await updateAnimal(Number(id), {
        caravana: values.caravana.trim(),
        raza: values.raza,
        sexo: values.sexo,
        fecha_nacimiento: values.fecha_nacimiento,
        lote_id: null,
      });
      toast.success("Animal actualizado correctamente.");
      close();
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

  if (!values) return null; // Cargando datos antes de abrir el drawer

  return (
    <>
      <div
        className={`drawer-overlay ${visible ? "drawer-overlay--visible" : ""}`}
        onClick={close}
        aria-hidden="true"
      />
      <aside
        className={`drawer ${visible ? "drawer--visible" : ""}`}
        aria-label="Editar animal">
        <div className="drawer-header">
          <h2>Editar animal</h2>
          <button
            type="button"
            className="drawer-close"
            onClick={close}
            aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="drawer-body">
          {formError && (
            <p className="status-message error" role="alert">
              {formError}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="caravana">Caravana</label>
              <input
                id="caravana"
                name="caravana"
                type="text"
                value={values.caravana}
                onChange={updateField("caravana")}
                aria-describedby={
                  errors.caravana ? "caravana-error" : undefined
                }
              />
              {errors.caravana && (
                <span id="caravana-error" className="field-error">
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
                onChange={updateField("raza")}>
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
                onChange={updateField("sexo")}>
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
              />
              {errors.fecha_nacimiento && (
                <span id="fecha-nacimiento-error" className="field-error">
                  {errors.fecha_nacimiento}
                </span>
              )}
            </div>

            <div className="form-actions">
              <button type="button" onClick={close}>
                Cancelar
              </button>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      </aside>
    </>
  );
}

export default RodeoEditarPage;
