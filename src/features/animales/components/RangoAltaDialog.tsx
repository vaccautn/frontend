import { useState } from "react";
import { Button, Dialog, Field, Portal } from "@chakra-ui/react";
import { FechaInput } from "@/components/FechaInput";

type Props = {
  open: boolean;
  desdeInicial: string;
  hastaInicial: string;
  onCancelar: () => void;
  onAplicar: (desde: string, hasta: string) => void;
};

function hoyLocal(): string {
  const ahora = new Date();
  return [
    ahora.getFullYear(),
    String(ahora.getMonth() + 1).padStart(2, "0"),
    String(ahora.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Rango de fechas de alta. Se puede dejar vacío uno de los dos extremos. */
export function RangoAltaDialog({ open, desdeInicial, hastaInicial, onCancelar, onAplicar }: Props) {
  const [desde, setDesde] = useState(desdeInicial);
  const [hasta, setHasta] = useState(hastaInicial);
  const invertido = !!desde && !!hasta && desde > hasta;

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
              <Dialog.Title>Fecha de alta</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body className="rango-alta">
              <p className="rango-alta__ayuda">
                Animales cargados en el sistema entre estas fechas. Podés dejar una vacía.
              </p>
              <div className="rango-alta__campos">
                <Field.Root>
                  <Field.Label>Desde</Field.Label>
                  <FechaInput value={desde} max={hoyLocal()} onChange={setDesde} aria-label="Alta desde" />
                </Field.Root>
                <Field.Root invalid={invertido}>
                  <Field.Label>Hasta</Field.Label>
                  <FechaInput value={hasta} max={hoyLocal()} onChange={setHasta} aria-label="Alta hasta" />
                  <Field.ErrorText>La fecha "hasta" no puede ser anterior a "desde".</Field.ErrorText>
                </Field.Root>
              </div>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" onClick={onCancelar}>
                Cancelar
              </Button>
              <Button
                colorPalette="brand"
                disabled={(!desde && !hasta) || invertido}
                onClick={() => onAplicar(desde, hasta)}>
                Aplicar
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
