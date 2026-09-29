import { useState, type ChangeEvent } from "react";
import { Button, Dialog, Field, Input, Portal } from "@chakra-ui/react";

type Props = {
  open: boolean;
  loteNombre: string;
  saving: boolean;
  onCancelar: () => void;
  onConfirmar: (receptividadEvHa?: number) => void;
};

export function GuardarPoligonoDialog({
  open,
  loteNombre,
  saving,
  onCancelar,
  onConfirmar,
}: Props) {
  const [receptividad, setReceptividad] = useState("");

  const handleConfirmar = () => {
    const valor = receptividad.trim();
    onConfirmar(valor ? Number(valor) : undefined);
    setReceptividad("");
  };

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
            <Dialog.Body>
              <Field.Root>
                <Field.Label>Receptividad (EV/ha, opcional)</Field.Label>
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={receptividad}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setReceptividad(event.target.value)
                  }
                  placeholder="Ej: 1.5"
                />
              </Field.Root>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" onClick={onCancelar} disabled={saving}>
                Cancelar
              </Button>
              <Button
                colorPalette="brand"
                onClick={handleConfirmar}
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
