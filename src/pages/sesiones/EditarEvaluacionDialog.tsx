import { useState, type FormEvent } from "react";
import { Button, Dialog, Field, Input, Portal, Textarea } from "@chakra-ui/react";
import { toast } from "react-toastify";
import { normalizeBackendDetail } from "@/features/auth";
import type {
  EvaluacionCC,
  UpdateEvaluacionCCSesionPayload,
} from "@/features/animales/types";
import { ApiError } from "@/services/httpClient";

type EditarEvaluacionDialogProps = {
  evaluacion: EvaluacionCC;
  onClose: () => void;
  onSubmit: (payload: UpdateEvaluacionCCSesionPayload) => Promise<boolean>;
};

export function EditarEvaluacionDialog({
  evaluacion,
  onClose,
  onSubmit,
}: EditarEvaluacionDialogProps) {
  const [valorCc, setValorCc] = useState(String(evaluacion.valor_cc));
  const [observaciones, setObservaciones] = useState(evaluacion.observaciones);
  const [valorError, setValorError] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;

    const parsedValue = Number(valorCc);
    if (
      valorCc.trim() === "" ||
      !Number.isInteger(parsedValue) ||
      parsedValue < 1 ||
      parsedValue > 5
    ) {
      setValorError("Ingresá un valor entero entre 1 y 5.");
      return;
    }

    setValorError("");
    setFormError("");
    setPending(true);
    try {
      const refreshed = await onSubmit({
        valor_cc: parsedValue,
        observaciones,
      });
      if (!refreshed) return;
      toast.success("Evaluación actualizada correctamente.");
      onClose();
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? normalizeBackendDetail(error.detail)
          : "No se pudo actualizar la evaluación. Probá nuevamente.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog.Root
      open
      onOpenChange={(details) => !details.open && !pending && onClose()}>
      <Portal>
        <Dialog.Backdrop className="sesion-edit__backdrop" />
        <Dialog.Positioner>
          <Dialog.Content className="sesion-edit__dialog">
            <Dialog.Header>
              <div>
                <Dialog.Title>Editar evaluación</Dialog.Title>
                <p>Animal #{evaluacion.animal_id}</p>
              </div>
              <Dialog.CloseTrigger asChild>
                <button
                  type="button"
                  className="sesion-edit__close"
                  aria-label="Cerrar edición"
                  disabled={pending}>
                  ✕
                </button>
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body>
              {formError && (
                <p className="status-message error" role="alert">
                  {formError}
                </p>
              )}
              <form id="sesion-edit-form" onSubmit={handleSubmit} noValidate>
                <Field.Root invalid={!!valorError} required>
                  <Field.Label>Condición corporal</Field.Label>
                  <Input
                    value={valorCc}
                    onChange={(event) => setValorCc(event.target.value)}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={5}
                    step={1}
                    disabled={pending}
                    aria-describedby="sesion-edit-cc-help"
                  />
                  <Field.HelperText id="sesion-edit-cc-help">Valor entero de 1 a 5.</Field.HelperText>
                  <Field.ErrorText>{valorError}</Field.ErrorText>
                </Field.Root>

                <Field.Root>
                  <Field.Label>Observaciones</Field.Label>
                  <Textarea
                    value={observaciones}
                    onChange={(event) => setObservaciones(event.target.value)}
                    rows={4}
                    disabled={pending}
                    placeholder="Agregá una observación si hace falta."
                  />
                </Field.Root>
              </form>
            </Dialog.Body>

            <Dialog.Footer>
              <Button variant="ghost" onClick={onClose} disabled={pending}>
                Cancelar
              </Button>
              <Button
                colorPalette="brand"
                type="submit"
                form="sesion-edit-form"
                loading={pending}
                disabled={pending}>
                Guardar cambios
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
