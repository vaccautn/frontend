import { Button, NativeSelect } from "@chakra-ui/react";
import { IconPencil, IconPolygon, IconTrash, IconX } from "@tabler/icons-react";
import type { LoteOption } from "@/features/lotes/types";

type Modo = "ver" | "dibujar" | "editar";

type Props = {
  modo: Modo;
  lotesSinPoligono: LoteOption[];
  loteParaDibujo: number | "";
  onLoteParaDibujoChange: (id: number | "") => void;
  onIniciarDibujo: () => void;
  onIniciarEdicion: () => void;
  onCancelar: () => void;
  onEliminarSeleccionado: () => void;
  puedeEliminarSeleccionado: boolean;
  hayLotesConPoligono: boolean;
};

export function DibujoToolbar({
  modo,
  lotesSinPoligono,
  loteParaDibujo,
  onLoteParaDibujoChange,
  onIniciarDibujo,
  onIniciarEdicion,
  onCancelar,
  onEliminarSeleccionado,
  puedeEliminarSeleccionado,
  hayLotesConPoligono,
}: Props) {
  if (modo !== "ver") {
    return (
      <div className="mapa-toolbar">
        <span className="mapa-toolbar__hint">
          {modo === "dibujar"
            ? "Dibujá el contorno del lote sobre el mapa (doble clic para terminar)."
            : "Arrastrá los vértices para ajustar el lote. Los cambios se guardan solos."}
        </span>
        <Button size="sm" variant="ghost" onClick={onCancelar}>
          <IconX size={16} stroke={1.75} />
          {modo === "dibujar" ? "Cancelar dibujo" : "Terminar edición"}
        </Button>
      </div>
    );
  }

  return (
    <div className="mapa-toolbar">
      <NativeSelect.Root size="sm" width="14rem">
        <NativeSelect.Field
          value={loteParaDibujo}
          onChange={(event) =>
            onLoteParaDibujoChange(event.target.value ? Number(event.target.value) : "")
          }>
          <option value="">Elegí un lote para dibujar...</option>
          {lotesSinPoligono.map((lote) => (
            <option key={lote.id} value={lote.id}>
              {lote.nombre}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>

      <Button
        size="sm"
        colorPalette="brand"
        disabled={!loteParaDibujo}
        onClick={onIniciarDibujo}>
        <IconPolygon size={16} stroke={1.75} />
        Dibujar lote
      </Button>

      <Button
        size="sm"
        variant="outline"
        colorPalette="brand"
        disabled={!hayLotesConPoligono}
        onClick={onIniciarEdicion}>
        <IconPencil size={16} stroke={1.75} />
        Editar forma
      </Button>

      <Button
        size="sm"
        variant="outline"
        colorPalette="red"
        disabled={!puedeEliminarSeleccionado}
        onClick={onEliminarSeleccionado}>
        <IconTrash size={16} stroke={1.75} />
        Quitar polígono seleccionado
      </Button>
    </div>
  );
}
