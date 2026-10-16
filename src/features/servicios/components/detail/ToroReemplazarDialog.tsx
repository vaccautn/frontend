import { useState } from "react";
import { Button, Dialog, NativeSelect, Portal, Textarea } from "@chakra-ui/react";
import { toast } from "react-toastify";
import { normalizeBackendDetail } from "@/features/auth";
import { ApiError } from "@/services/httpClient";
import { reemplazarToro } from "../../services/serviciosService";
import type { ToroServicio } from "../../types";

type Props = {
  servicioId: number;
  toroBaja: ToroServicio;
  repuestos: ToroServicio[];
  open: boolean;
  onClose: () => void;
  onReemplazado: (toros: ToroServicio[]) => void;
};

export function ToroReemplazarDialog({ servicioId, toroBaja, repuestos, open, onClose, onReemplazado }: Props) {
  const [repuestoId, setRepuestoId] = useState<number | "">(repuestos[0]?.animal.id ?? "");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);

  const caravanaBaja = toroBaja.animal.caravana ?? `#${toroBaja.animal.id}`;

  const confirmar = async () => {
    if (!repuestoId || enviando) return;
    setEnviando(true);
    try {
      const toros = await reemplazarToro(servicioId, {
        toro_baja_animal_id: toroBaja.animal.id,
        toro_repuesto_animal_id: Number(repuestoId),
        motivo: motivo.trim(),
      });
      toast.success(`${caravanaBaja} reemplazado correctamente.`);
      onReemplazado(toros);
      onClose();
      setMotivo("");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? (normalizeBackendDetail(error.detail) ?? "No se pudo reemplazar el toro.")
          : "No se pudo reemplazar el toro.",
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(details) => !details.open && onClose()}>
      <Portal>
        <Dialog.Backdrop className="animal-evaluacion__backdrop" />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Reemplazar {caravanaBaja}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body display="flex" flexDirection="column" gap="3">
              <label className="cargar-resultados__fecha">
                <span>Toro de repuesto</span>
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field
                    value={repuestoId}
                    onChange={(event) =>
                      setRepuestoId(event.target.value ? Number(event.target.value) : "")
                    }>
                    {repuestos.map((r) => (
                      <option key={r.animal.id} value={r.animal.id}>
                        {r.animal.caravana ?? `#${r.animal.id}`} · {r.animal.raza}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </label>
              <label className="cargar-resultados__fecha">
                <span>Motivo (opcional)</span>
                <Textarea
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  rows={2}
                  placeholder="Ej: se lastimó una pata"
                />
              </label>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" onClick={onClose} disabled={enviando}>
                Cancelar
              </Button>
              <Button colorPalette="brand" onClick={confirmar} loading={enviando} disabled={!repuestoId}>
                Reemplazar
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
