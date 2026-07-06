import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ApiError } from "@/services/httpClient";
import {
  getAnimal,
  updateAnimal,
} from "@/features/rodeo/services/rodeoService";
import {
  validateRodeoEditarForm,
  type RodeoEditarFieldErrors,
  type RodeoEditarValues,
} from "@/features/rodeo/utils/rodeoValidation";
import { normalizeBackendDetail } from "@/features/auth";
import type { EstadoAnimal } from "@/features/rodeo/types";

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
  const [visible, setVisible] = useState(false);
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
      requestAnimationFrame(() => setVisible(true));
    });
  }, [id]);

  const close = (refresh = false) => {
    const shouldRefresh = typeof refresh === "boolean" ? refresh : false;
    setVisible(false);
    setTimeout(
      () => navigate("/rodeo", { state: { refresh: shouldRefresh } }),
      300,
    );
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
    <>
      <div
        className={`drawer-overlay ${visible ? "drawer-overlay--visible" : ""}`}
        onClick={() => close()}
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
            onClick={() => close()}
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
                max={new Date().toISOString().split("T")[0]} // impide seleccionar fecha futura
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

            <div className="field">
              <label htmlFor="estado">Estado</label>
              <select
                id="estado"
                name="estado"
                value={values.estado}
                onChange={updateField("estado")}
                aria-describedby={errors.estado ? "estado-error" : undefined}>
                <option value="">Seleccioná el estado</option>
                {ESTADOS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.estado && (
                <span id="estado-error" className="field-error">
                  {errors.estado}
                </span>
              )}
            </div>

            <div className="field">
              <label htmlFor="observacion">Observación</label>
              <textarea
                id="observacion"
                name="observacion"
                value={values.observacion}
                onChange={updateField("observacion")}
                rows={3}
              />
            </div>

            <div className="field">
              <label htmlFor="lote-id">Lote</label>
              <input
                id="lote-id"
                name="lote_id"
                type="number"
                min={1}
                value={values.lote_id}
                onChange={updateField("lote_id")}
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => close()}>
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
