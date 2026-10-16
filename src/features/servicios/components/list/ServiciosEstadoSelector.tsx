import { useState } from "react";
import { Menu, Portal } from "@chakra-ui/react";
import { IconChevronDown } from "@tabler/icons-react";
import { ESTADOS_SERVICIO } from "../../constants";
import type { EstadoServicio, ServicioRead } from "../../types";
import { colorPorEstadoServicio } from "../../utils/servicioEstadoColor";

type Props = {
  servicios: ServicioRead[];
  estado: EstadoServicio | null;
  onChange: (estado: EstadoServicio | null) => void;
};

const ESTADOS_FILTRABLES = ESTADOS_SERVICIO.filter((e) => e.value !== "CANCELADO");

export function ServiciosEstadoSelector({ servicios, estado, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const total = servicios.length;
  const conteoPorEstado = new Map<EstadoServicio, number>();
  for (const s of servicios) {
    conteoPorEstado.set(s.estado, (conteoPorEstado.get(s.estado) ?? 0) + 1);
  }

  const actual = ESTADOS_FILTRABLES.find((e) => e.value === estado);

  const handleSelect = (value: EstadoServicio | null) => {
    onChange(value);
    setOpen(false);
  };

  return (
    <Menu.Root open={open} onOpenChange={(details) => setOpen(details.open)}>
      <Menu.Trigger asChild>
        <button type="button" className="rodeo-lote-selector__trigger" aria-label="Filtrar por estado del servicio">
          <span
            className="rodeo-lote-selector__dot"
            style={{ background: actual ? colorPorEstadoServicio(actual.value) : "#1d2420" }}
          />
          <span className="rodeo-lote-selector__label">{actual?.label ?? "Todos los estados"}</span>
          <span className="rodeo-lote-selector__count">{estado ? (conteoPorEstado.get(estado) ?? 0) : total}</span>
          <IconChevronDown size={14} stroke={1.75} />
        </button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content className="rodeo-lote-selector__menu">
            <div
              className="rodeo-lote-selector__item"
              data-activo={estado === null}
              onClick={() => handleSelect(null)}>
              <span className="rodeo-lote-selector__dot" style={{ background: "#1d2420" }} />
              <span className="rodeo-lote-selector__item-label">Todos los estados</span>
              <span className="rodeo-lote-selector__item-count">{total}</span>
              {estado === null && <span className="rodeo-lote-selector__check">✓</span>}
            </div>

            {ESTADOS_FILTRABLES.map((e) => (
              <div
                key={e.value}
                className="rodeo-lote-selector__item"
                data-activo={estado === e.value}
                onClick={() => handleSelect(e.value)}>
                <span className="rodeo-lote-selector__dot" style={{ background: colorPorEstadoServicio(e.value) }} />
                <span className="rodeo-lote-selector__item-label">{e.label}</span>
                <span className="rodeo-lote-selector__item-count">{conteoPorEstado.get(e.value) ?? 0}</span>
                {estado === e.value && <span className="rodeo-lote-selector__check">✓</span>}
              </div>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
