import { Button, NativeSelect } from "@chakra-ui/react";
import { IconPencil, IconPolygon, IconTrash, IconX } from "@tabler/icons-react";
import type { LoteOption } from "@/features/lotes/types";

type Modo = "ver" | "dibujar" | "editar";

type Props = {
  open: boolean;
  onClose: () => void;
  modo: Modo;
  lotesSinPoligono: LoteOption[];
  loteParaDibujo: number | "";
  onLoteParaDibujoChange: (id: number | "") => void;
  onIniciarDibujo: () => void;
  onIniciarEdicion: () => void;
  onCancelar: () => void;
  onEliminarSeleccionado: () => void;
  puedeEliminarSeleccionado: boolean;
};

export function DibujoToolbar({
  open,
  onClose,
  modo,
  lotesSinPoligono,
  loteParaDibujo,
  onLoteParaDibujoChange,
  onIniciarDibujo,
  onIniciarEdicion,
  onCancelar,
  onEliminarSeleccionado,
  puedeEliminarSeleccionado,
}: Props) {
  return (
    <>
      {open && (
        <div className="mapa-lotes-popover">
          <div className="mapa-lotes-popover__header">
            <span>Lotes</span>
            <button
              type="button"
              className="mapa-lotes-popover__cerrar"
              onClick={onClose}
              title="Cerrar">
              <IconX size={16} stroke={1.75} />
            </button>
          </div>

          <NativeSelect.Root size="sm" width="100%">
            <NativeSelect.Field
              value={loteParaDibujo}
              onChange={(event) =>
                onLoteParaDibujoChange(event.target.value ? Number(event.target.value) : "")
              }>
              <option value="">Elegí un lote…</option>
              {lotesSinPoligono.map((lote) => (
                <option key={lote.id} value={lote.id}>
                  {lote.nombre}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>

          <Button
            width="100%"
            colorPalette="brand"
            disabled={!loteParaDibujo}
            onClick={onIniciarDibujo}>
            <IconPolygon size={16} stroke={1.75} />
            Dibujar lote
          </Button>

          {puedeEliminarSeleccionado && (
            <div className="mapa-lotes-popover__acciones">
              <Button flex="1" size="sm" variant="subtle" colorPalette="brand" onClick={onIniciarEdicion}>
                <IconPencil size={14} stroke={1.75} />
                Editar forma
              </Button>
              <Button flex="1" size="sm" variant="subtle" colorPalette="red" onClick={onEliminarSeleccionado}>
                <IconTrash size={14} stroke={1.75} />
                Quitar
              </Button>
            </div>
          )}
        </div>
      )}

      {modo !== "ver" && (
        <div className="mapa-hint-pill">
          <span>
            {modo === "dibujar"
              ? "Dibujá el contorno del lote sobre el mapa (doble clic para terminar)."
              : "Arrastrá los vértices para ajustar el lote. Los cambios se guardan solos."}
          </span>
          <button type="button" className="mapa-hint-pill__accion" onClick={onCancelar}>
            {modo === "dibujar" ? "Cancelar dibujo" : "Terminar edición"}
          </button>
        </div>
      )}
    </>
  );
}
