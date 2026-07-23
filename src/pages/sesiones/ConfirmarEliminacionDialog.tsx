import { useState } from "react";
import { Button, Dialog, Portal } from "@chakra-ui/react";
import { toast } from "react-toastify";
import { normalizeBackendDetail } from "@/features/auth";
import type { EvaluacionCC } from "@/features/animales/types";
import { ApiError } from "@/services/httpClient";

type ConfirmarEliminacionDialogProps = {
  evaluacion: EvaluacionCC;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
};

export function ConfirmarEliminacionDialog({
  evaluacion,
  onClose,
  onConfirm,
}: ConfirmarEliminacionDialogProps) {
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleConfirm = async () => {
    if (pending) return;
    setPending(true);
    setErrorMessage("");
    try {
      const refreshed = await onConfirm();
      if (!refreshed) return;
      toast.success("Evaluación eliminada del detalle.");
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? normalizeBackendDetail(error.detail)
          : "No se pudo eliminar la evaluación. Probá nuevamente.",
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
                <Dialog.Title>Eliminar evaluación</Dialog.Title>
                <p>Animal #{evaluacion.animal_id}</p>
              </div>
              <Dialog.CloseTrigger asChild>
                <button
                  type="button"
                  className="sesion-edit__close"
                  aria-label="Cerrar confirmación"
                  disabled={pending}>
                  ✕
                </button>
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body>
              <p className="sesion-delete__warning">
                Esta evaluación dejará de aparecer en el detalle y en los resúmenes
                de la sesión. Su registro se conservará.
              </p>
              {errorMessage && (
                <p className="status-message error" role="alert">
                  {errorMessage}
                </p>
              )}
            </Dialog.Body>

            <Dialog.Footer>
              <Button variant="ghost" onClick={onClose} disabled={pending}>
                Cancelar
              </Button>
              <Button
                colorPalette="red"
                onClick={handleConfirm}
                loading={pending}
                disabled={pending}>
                Eliminar
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
