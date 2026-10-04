import { useState, type ChangeEvent } from "react";
import { Button, Dialog, Field, Input, NativeSelect, Portal } from "@chakra-ui/react";
import type { LoteOption } from "@/features/lotes/types";

type Props = {
  open: boolean;
  nombreDetectado: string;
  lotesDisponibles: LoteOption[];
  saving: boolean;
  onCancelar: () => void;
  onConfirmar: (loteId: number, receptividadEvHa?: number) => void;
};

export function VincularKmzDialog({
  open,
  nombreDetectado,
  lotesDisponibles,
  saving,
  onCancelar,
  onConfirmar,
}: Props) {
  const [loteId, setLoteId] = useState<number | "">("");
  const [receptividad, setReceptividad] = useState("");

  const handleConfirmar = () => {
    if (!loteId) return;
    const valorReceptividad = receptividad.trim();
    onConfirmar(Number(loteId), valorReceptividad ? Number(valorReceptividad) : undefined);
    setLoteId("");
    setReceptividad("");
  };

  const handleCerrar = () => {
    setLoteId("");
    setReceptividad("");
    onCancelar();
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) handleCerrar();
      }}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Vincular potrero importado</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {nombreDetectado ? (
                <div style={{ fontSize: "0.88rem", color: "#4a5568" }}>
                  Nombre en Google Earth: <strong>{nombreDetectado}</strong>
                </div>
              ) : (
                <div style={{ fontSize: "0.88rem", color: "#718096" }}>
                  Potrero importado sin etiqueta en el archivo.
                </div>
              )}

              {lotesDisponibles.length === 0 ? (
                <p style={{ fontSize: "0.88rem", color: "#e53e3e" }}>
                  No hay lotes disponibles sin polígono. Creá un lote nuevo en la sección de lotes
                  para poder vincular este potrero.
                </p>
              ) : (
                <Field.Root required>
                  <Field.Label>Lote de Vacca al que corresponde:</Field.Label>
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      value={loteId}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        setLoteId(e.target.value ? Number(e.target.value) : "")
                      }>
                      <option value="">Elegí un lote existente...</option>
                      {lotesDisponibles.map((lote) => (
                        <option key={lote.id} value={lote.id}>
                          {lote.nombre} ({lote.categoria})
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Field.Root>
              )}

              <Field.Root>
                <Field.Label>Receptividad (EV/ha, opcional):</Field.Label>
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={receptividad}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setReceptividad(e.target.value)}
                  placeholder="Ej: 1.2"
                />
              </Field.Root>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" onClick={handleCerrar} disabled={saving}>
                Cancelar
              </Button>
              <Button
                colorPalette="brand"
                onClick={handleConfirmar}
                disabled={!loteId || lotesDisponibles.length === 0}
                loading={saving}
                loadingText="Vinculando...">
                Vincular a este lote
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
