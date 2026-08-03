import { useState, type FormEvent } from "react";
import {
  Button,
  Dialog,
  Field,
  Menu,
  Portal,
  Textarea,
} from "@chakra-ui/react";
import { IconChevronDown, IconTrash } from "@tabler/icons-react";
import { toast } from "react-toastify";
import { normalizeBackendDetail } from "@/features/auth";
import type {
  EvaluacionCC,
  UpdateEvaluacionCCSesionPayload,
} from "@/features/animales/types";
import { getAnimalRfidLabel } from "@/features/animales/utils/animalRfid";
import { ApiError } from "@/services/httpClient";

type EditarEvaluacionDialogProps = {
  evaluacion: EvaluacionCC;
  onClose: () => void;
  onSubmit: (payload: UpdateEvaluacionCCSesionPayload) => Promise<boolean>;
  onDelete?: (evaluacion: EvaluacionCC) => void;
};

const CC_OPCIONES = [1, 2, 3, 4, 5];

export function EditarEvaluacionDialog({
  evaluacion,
  onClose,
  onSubmit,
  onDelete,
}: EditarEvaluacionDialogProps) {
  const animalRfid = getAnimalRfidLabel(evaluacion.animal_rfid);
  const [valorCc, setValorCc] = useState(evaluacion.valor_cc);
  const [observaciones, setObservaciones] = useState(evaluacion.observaciones);
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;

    setFormError("");
    setPending(true);
    try {
      const refreshed = await onSubmit({
        valor_cc: valorCc,
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
                <p>RFID: {animalRfid}</p>
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
                <Field.Root required>
                  <Field.Label>Condición corporal</Field.Label>
                  <Menu.Root>
                    <Menu.Trigger asChild>
                      <button
                        type="button"
                        className="animal-evaluacion__valor-trigger"
                        disabled={pending}
                        aria-label="Seleccionar valor de CC">
                        <span>{valorCc}</span>
                        <IconChevronDown
                          className="animal-evaluacion__valor-caret"
                          size={16}
                          stroke={1.5}
                        />
                      </button>
                    </Menu.Trigger>
                    <Portal>
                      <Menu.Positioner>
                        <Menu.Content className="animal-evaluacion__valor-menu">
                          <Menu.RadioItemGroup
                            value={String(valorCc)}
                            onValueChange={(details) =>
                              setValorCc(Number(details.value))
                            }>
                            {CC_OPCIONES.map((opcion) => (
                              <Menu.RadioItem
                                key={opcion}
                                value={String(opcion)}>
                                {opcion}
                              </Menu.RadioItem>
                            ))}
                          </Menu.RadioItemGroup>
                        </Menu.Content>
                      </Menu.Positioner>
                    </Portal>
                  </Menu.Root>
                  <Field.HelperText>Valor entero de 1 a 5.</Field.HelperText>
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

            <Dialog.Footer className="sesion-edit__footer">
              {onDelete && (
                <Button
                  variant="ghost"
                  colorPalette="red"
                  onClick={() => onDelete(evaluacion)}
                  disabled={pending}
                  className="sesion-edit__delete">
                  <IconTrash size={16} stroke={1.5} />
                  Eliminar
                </Button>
              )}
              <div className="sesion-edit__footer-actions">
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
              </div>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
