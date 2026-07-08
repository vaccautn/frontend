import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  Button,
  Dialog,
  Field,
  Input,
  Portal,
  Textarea,
} from "@chakra-ui/react";
import { toast } from "react-toastify";
import { normalizeBackendDetail } from "@/features/auth";
import { DEFAULT_CC_SCALE } from "@/features/animales/constants";
import { registerEvaluacionCc } from "@/features/animales/services/animalesService";
import type { Animal } from "@/features/animales/types";
import { ApiError } from "@/services/httpClient";

type RegistrarEvaluacionCCDialogProps = {
  animal: Animal | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
};

type FormValues = {
  valorCc: string;
  observaciones: string;
};

type FormErrors = {
  valorCc?: string;
};

const INITIAL_VALUES: FormValues = {
  valorCc: "",
  observaciones: "",
};

function normalizeCcValue(value: string) {
  return value.replace(",", ".").trim();
}

export function RegistrarEvaluacionCCDialog({
  animal,
  open,
  onClose,
  onSuccess,
}: RegistrarEvaluacionCCDialogProps) {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scaleLabel = useMemo(
    () => `${DEFAULT_CC_SCALE.min} a ${DEFAULT_CC_SCALE.max}`,
    [],
  );

  const updateField =
    (field: keyof FormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      if (field === "valorCc") {
        setErrors((current) => ({ ...current, valorCc: undefined }));
      }
      setFormError("");
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting || !animal) return;

    if (animal.estado !== "ACTIVO") {
      setFormError(
        "No es posible registrar una evaluación porque el animal no se encuentra activo.",
      );
      return;
    }

    const nextErrors: FormErrors = {};
    const normalizedScore = normalizeCcValue(values.valorCc);

    if (!normalizedScore) {
      nextErrors.valorCc =
        "Debés ingresar un valor de condición corporal para registrar la evaluación.";
    } else {
      const parsedScore = Number(normalizedScore);

      if (
        Number.isNaN(parsedScore) ||
        parsedScore < DEFAULT_CC_SCALE.min ||
        parsedScore > DEFAULT_CC_SCALE.max
      ) {
        nextErrors.valorCc =
          "El valor ingresado no pertenece a la escala configurada. Ingresá un valor entre 1 y 9.";
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await registerEvaluacionCc({
        animal_id: animal.id,
        valor_cc: normalizedScore,
        escala_min: DEFAULT_CC_SCALE.min,
        escala_max: DEFAULT_CC_SCALE.max,
        observaciones: values.observaciones.trim(),
      });

      await onSuccess();
      toast.success("Evaluación de condición corporal registrada correctamente.");
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(
          normalizeBackendDetail(error.detail) ??
            "No pudimos registrar la evaluación en este momento. Revisá tu conexión o intentá nuevamente. Los datos ingresados no se perdieron.",
        );
      } else {
        setFormError(
          "No pudimos registrar la evaluación en este momento. Revisá tu conexión o intentá nuevamente. Los datos ingresados no se perdieron.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(details) => !details.open && onClose()}>
      <Portal>
        <Dialog.Backdrop className="animal-evaluacion__backdrop" />
        <Dialog.Positioner>
          <Dialog.Content className="animal-evaluacion__dialog">
            <Dialog.Header className="animal-evaluacion__header">
              <div>
                <span className="animal-evaluacion__eyebrow">Condición corporal</span>
                <Dialog.Title>Registrar evaluación de CC</Dialog.Title>
              </div>
              <Dialog.CloseTrigger asChild>
                <button
                  type="button"
                  className="animal-form__close"
                  aria-label="Cerrar">
                  ✕
                </button>
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body className="animal-evaluacion__body">
              {formError && (
                <p className="status-message error" role="alert">
                  {formError}
                </p>
              )}

              {animal && (
                <dl className="animal-evaluacion__summary">
                  <div>
                    <dt>Caravana</dt>
                    <dd>{animal.caravana ?? `#${animal.id}`}</dd>
                  </div>
                  <div>
                    <dt>Estado</dt>
                    <dd>{animal.estado}</dd>
                  </div>
                  <div>
                    <dt>Escala utilizada</dt>
                    <dd>{scaleLabel}</dd>
                  </div>
                  <div>
                    <dt>Fecha y hora</dt>
                    <dd>Se registran automáticamente al guardar</dd>
                  </div>
                </dl>
              )}

              <form
                id="animal-evaluacion-form"
                onSubmit={handleSubmit}
                noValidate
                className="animal-form__fields">
                <Field.Root invalid={!!errors.valorCc} required>
                  <Field.Label>Valor de CC</Field.Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={DEFAULT_CC_SCALE.min}
                    max={DEFAULT_CC_SCALE.max}
                    step={DEFAULT_CC_SCALE.step}
                    placeholder={`Ingresá un valor entre ${scaleLabel}`}
                    value={values.valorCc}
                    onChange={updateField("valorCc")}
                  />
                  <Field.HelperText>Escala vigente: {scaleLabel}.</Field.HelperText>
                  <Field.ErrorText>{errors.valorCc}</Field.ErrorText>
                </Field.Root>

                <Field.Root>
                  <Field.Label>Observación</Field.Label>
                  <Textarea
                    value={values.observaciones}
                    onChange={updateField("observaciones")}
                    rows={4}
                    placeholder="Agregá una observación si hace falta."
                  />
                </Field.Root>
              </form>
            </Dialog.Body>

            <Dialog.Footer className="animal-evaluacion__footer">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                form="animal-evaluacion-form"
                colorPalette="brand"
                loading={isSubmitting}
                loadingText="Registrando..."
                disabled={!animal || animal.estado !== "ACTIVO"}>
                Registrar evaluación
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
