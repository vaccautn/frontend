import { useMemo, useState } from "react";
import { Menu, Portal } from "@chakra-ui/react";
import { IconChevronDown } from "@tabler/icons-react";
import {
  colorPorEstadoLote,
  labelPorEstadoLote,
} from "@/features/mapa/utils/estadoLoteColor";
import type { LotePotreroPropiedades } from "@/features/mapa/types";

type Props = {
  lotes: LotePotreroPropiedades[];
  loteSeleccionadoId: number | null;
  totalAnimales: number;
  onSelect: (loteId: number | null) => void;
};

export function RodeoLoteSelector({
  lotes,
  loteSeleccionadoId,
  totalAnimales,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const loteSeleccionado =
    lotes.find((l) => l.id === loteSeleccionadoId) ?? null;

  const lotesFiltrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lotes;
    return lotes.filter((l) => l.nombre.toLowerCase().includes(q));
  }, [lotes, query]);

  const handleSelect = (loteId: number | null) => {
    onSelect(loteId);
    setOpen(false);
    setQuery("");
  };

  return (
    <Menu.Root
      open={open}
      onOpenChange={(details) => {
        setOpen(details.open);
        if (!details.open) setQuery("");
      }}>
      <Menu.Trigger asChild>
        <button type="button" className="rodeo-lote-selector__trigger">
          <span
            className="rodeo-lote-selector__dot"
            style={{
              background: loteSeleccionado
                ? colorPorEstadoLote(loteSeleccionado.estado)
                : "#1d2420",
            }}
          />
          <span className="rodeo-lote-selector__label">
            {loteSeleccionado ? loteSeleccionado.nombre : "Todos los lotes"}
          </span>
          <span className="rodeo-lote-selector__count">
            {loteSeleccionado
              ? loteSeleccionado.cantidad_animales
              : totalAnimales}
          </span>
          <IconChevronDown size={14} stroke={1.75} />
        </button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content className="rodeo-lote-selector__menu">
            {/* <div
              className="rodeo-lote-selector__buscar"
              onClick={(event) => event.stopPropagation()}>
              <Input
                size="sm"
                placeholder="Buscar lote…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Buscar lote"
              />
            </div> */}

            <div
              className="rodeo-lote-selector__item"
              data-activo={loteSeleccionadoId === null}
              onClick={() => handleSelect(null)}>
              <span
                className="rodeo-lote-selector__dot"
                style={{ background: "#1d2420" }}
              />
              <span className="rodeo-lote-selector__item-label">
                Todos los lotes
              </span>
              <span className="rodeo-lote-selector__item-count">
                {totalAnimales}
              </span>
              {loteSeleccionadoId === null && (
                <span className="rodeo-lote-selector__check">✓</span>
              )}
            </div>

            {lotesFiltrados.map((lote) => (
              <div
                key={lote.id}
                className="rodeo-lote-selector__item"
                data-activo={loteSeleccionadoId === lote.id}
                onClick={() => handleSelect(lote.id)}>
                <span
                  className="rodeo-lote-selector__dot"
                  style={{ background: colorPorEstadoLote(lote.estado) }}
                />
                <span className="rodeo-lote-selector__item-label">
                  {lote.nombre}
                </span>
                <span
                  className="rodeo-lote-selector__item-estado"
                  style={{ color: colorPorEstadoLote(lote.estado) }}>
                  {labelPorEstadoLote(lote.estado)}
                </span>
                <span className="rodeo-lote-selector__item-count">
                  {lote.cantidad_animales}
                </span>
                {loteSeleccionadoId === lote.id && (
                  <span className="rodeo-lote-selector__check">✓</span>
                )}
              </div>
            ))}

            {lotesFiltrados.length === 0 && (
              <div className="rodeo-lote-selector__vacio">
                Sin coincidencias.
              </div>
            )}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
