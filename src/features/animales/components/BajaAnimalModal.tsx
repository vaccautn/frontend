import { useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import { normalizeBackendDetail } from "@/features/auth";
import { updateAnimal } from "@/features/animales/services/animalesService";
import type { Animal, BajaAnimalMotivo } from "@/features/animales/types";
import { ApiError } from "@/services/httpClient";

const MOTIVOS: { value: BajaAnimalMotivo; label: string }[] = [
  { value: "VENDIDO", label: "Vendido" },
  { value: "MUERTO", label: "Muerto" },
  { value: "DESCARTADO", label: "Descartado" },
];

type BajaAnimalModalProps = {
  animal: Animal;
  onClose: () => void;
  onSuccess: () => void;
};

function getTodayInputValue() {
  return new Date().toISOString().split("T")[0];
}

function formatBajaObservacion(
  fechaBaja: string,
  motivo: BajaAnimalMotivo,
  notas: string,
  observacionPrevia: string,
) {
  const notaNormalizada = notas.trim();
  const baja = `[Baja: ${fechaBaja} | Motivo: ${motivo}] - ${
    notaNormalizada || "Sin notas adicionales"
  }.`;
  const previa = observacionPrevia.trim();

  return previa ? `${baja} ${previa}` : baja;
}

export function BajaAnimalModal({
  animal,
  onClose,
  onSuccess,
}: BajaAnimalModalProps) {
  const [motivo, setMotivo] = useState<BajaAnimalMotivo | "">("");
  const [fechaBaja, setFechaBaja] = useState(getTodayInputValue());
  const [notas, setNotas] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSubmitBaja = animal.estado === "ACTIVO";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!canSubmitBaja) {
      setFormError(
        "Solo los animales en estado ACTIVO pueden ingresar al flujo de baja o eliminación.",
      );
      return;
    }

    if (!motivo) {
      setFormError("Selecciona un motivo de baja.");
      return;
    }

    if (!fechaBaja) {
      setFormError("Selecciona una fecha de baja.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    let shouldResetSubmitting = true;

    try {
      await updateAnimal(animal.id, {
        estado: motivo,
        observacion: formatBajaObservacion(
          fechaBaja,
          motivo,
          notas,
          animal.observacion,
        ),
      });

      setIsSubmitting(false);
      shouldResetSubmitting = false;
      onClose();
      toast.success("El animal ha sido dado de baja exitosamente.");
      onSuccess();
      return;
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(
          normalizeBackendDetail(error.detail) ?? "Error al dar de baja el animal.",
        );
      } else {
        setFormError("No se pudo dar de baja el animal. Proba nuevamente.");
      }
    } finally {
      if (shouldResetSubmitting) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="baja-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="baja-animal-title"
        onMouseDown={(event) => event.stopPropagation()}>
        <div className="baja-modal__header">
          <div>
            <span className="baja-modal__eyebrow">Baja de animal</span>
            <h2 id="baja-animal-title">Dar de baja animal</h2>
          </div>
          <button
            type="button"
            className="baja-modal__close"
            onClick={onClose}
            aria-label="Cerrar">
            x
          </button>
        </div>

        <p className="baja-modal__warning">
          ¿Está seguro de que desea dar de baja a este animal? Esta acción lo
          removerá del inventario activo, pero conservará su historial.
        </p>

        {!canSubmitBaja && (
          <p className="status-message error" role="alert">
            Solo los animales en estado ACTIVO pueden ingresar al flujo de baja o
            eliminación.
          </p>
        )}

        <dl className="baja-modal__summary">
          <div>
            <dt>Caravana</dt>
            <dd>{animal.caravana ?? "-"}</dd>
          </div>
          <div>
            <dt>Estado actual</dt>
            <dd>{animal.estado}</dd>
          </div>
        </dl>

        {formError && (
          <p className="status-message error" role="alert">
            {formError}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="motivo-baja">Motivo</label>
            <select
              id="motivo-baja"
              value={motivo}
              onChange={(event) => {
                const value = event.target.value;
                setMotivo(value ? (value as BajaAnimalMotivo) : "");
                setFormError("");
              }}
              required>
              <option value="">Selecciona un motivo</option>
              {MOTIVOS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="fecha-baja">Fecha de baja</label>
            <input
              id="fecha-baja"
              type="date"
              value={fechaBaja}
              max={getTodayInputValue()}
              onChange={(event) => {
                setFechaBaja(event.target.value);
                setFormError("");
              }}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="notas-baja">Notas adicionales</label>
            <textarea
              id="notas-baja"
              value={notas}
              onChange={(event) => setNotas(event.target.value)}
              rows={4}
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
             <button type="submit" disabled={isSubmitting || !canSubmitBaja}>
               {isSubmitting ? "Dando de baja..." : "Dar de baja"}
             </button>
          </div>
        </form>
      </section>
    </div>
  );
}
