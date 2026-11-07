import { useState } from "react";
import { toast } from "react-toastify";
import { postJson } from "@/services/httpClient";
import { getAccessToken } from "@/features/auth";
import type { Animal } from "../types";
import type { LoteOption } from "@/features/lotes/types";

export function MovimientoAnimales({
  animales,
  lotes,
  onMovidos,
}: {
  animales: Animal[];
  lotes: LoteOption[];
  onMovidos: () => void;
}) {
  const [destino, setDestino] = useState("");
  const [guardando, setGuardando] = useState(false);
  if (!animales.length) return null;
  const varios = new Set(animales.map((a) => a.lote_id)).size > 1;
  const mover = async () => {
    if (!destino || guardando) return;
    const nombre = lotes.find((l) => l.id === Number(destino))?.nombre;
    if (
      !window.confirm(
        `${varios ? "Seleccionaste animales de distintos lotes. " : ""}¿Mover ${animales.length} animales al lote ${nombre}?`,
      )
    )
      return;
    setGuardando(true);
    try {
      const result = await postJson<{ movidos: number }, object>(
        "/animales/mover",
        {
          animal_ids: animales.map((a) => a.id),
          lote_id: Number(destino),
          confirmar_varios_lotes: varios,
        },
        getAccessToken(),
      );
      toast.success(
        `${result.movidos} animales movidos. El movimiento quedó en el historial.`,
      );
      onMovidos();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo mover los animales",
      );
    } finally {
      setGuardando(false);
    }
  };
  return (
    <div className="evaluaciones-filtros">
      <strong>{animales.length} seleccionados</strong>
      {varios && (
        <span role="alert">Los animales pertenecen a distintos lotes.</span>
      )}
      <label>
        Mover al lote
        <select value={destino} onChange={(e) => setDestino(e.target.value)}>
          <option value="">Elegí un lote</option>
          {lotes
            .filter((l) => l.activo)
            .map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre}
              </option>
            ))}
        </select>
      </label>
      <button
        type="button"
        disabled={!destino || guardando}
        onClick={() => void mover()}
      >
        {guardando ? "Moviendo…" : "Mover animales"}
      </button>
    </div>
  );
}
