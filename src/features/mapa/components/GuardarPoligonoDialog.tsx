import { Button, Dialog, Portal } from "@chakra-ui/react";

type Props = {
  open: boolean;
  loteNombre: string;
  saving: boolean;
  onCancelar: () => void;
  onConfirmar: () => void;
};

export function GuardarPoligonoDialog({
  open,
  loteNombre,
  saving,
  onCancelar,
  onConfirmar,
}: Props) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) onCancelar();
      }}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Guardar lote "{loteNombre}"</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>¿Confirmás el polígono dibujado para este lote?</Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" onClick={onCancelar} disabled={saving}>
                Cancelar
              </Button>
              <Button
                colorPalette="brand"
                onClick={onConfirmar}
                loading={saving}
                loadingText="Guardando...">
                Guardar
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
