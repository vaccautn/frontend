import { Input, Menu, Portal } from "@chakra-ui/react";
import { IconChevronDown } from "@tabler/icons-react";
import type { EstadoSesion } from "@/features/sesiones/types";

const ESTADOS: { value: EstadoSesion; label: string }[] = [
  { value: "ABIERTA", label: "Abiertas" },
  { value: "CERRADA", label: "Cerradas" },
  { value: "CANCELADA", label: "Canceladas" },
];

type SesionesFiltrosProps = {
  estado: EstadoSesion | null;
  fechaDesde: string;
  fechaHasta: string;
  onEstadoChange: (value: EstadoSesion | null) => void;
  onFechaDesdeChange: (value: string) => void;
  onFechaHastaChange: (value: string) => void;
  onClear: () => void;
};

export function SesionesFiltros({
  estado,
  fechaDesde,
  fechaHasta,
  onEstadoChange,
  onFechaDesdeChange,
  onFechaHastaChange,
  onClear,
}: SesionesFiltrosProps) {
  const estadoLabel = ESTADOS.find((item) => item.value === estado)?.label;

  return (
    <div className="sesiones-filtros" role="search" aria-label="Filtros de sesiones">
      <Menu.Root>
        <Menu.Trigger asChild>
          <button
            type="button"
            className="animales-filtros__dropdown"
            aria-label="Filtrar por estado de sesión">
            <span>{estadoLabel ?? "Todos los estados"}</span>
            <IconChevronDown
              className="animales-filtros__dropdown-caret"
              size={16}
              stroke={1.5}
            />
          </button>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content className="animales-filtros__dropdown-menu">
              <Menu.Item value="" onSelect={() => onEstadoChange(null)}>
                Todos los estados
              </Menu.Item>
              <Menu.Separator />
              {ESTADOS.map(({ value, label }) => (
                <Menu.Item key={value} value={value} onSelect={() => onEstadoChange(value)}>
                  {label}
                </Menu.Item>
              ))}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>

      <div className="sesiones-filtros__campo">
        <label htmlFor="fecha-desde" className="sr-only">
          Filtrar desde
        </label>
        <Input
          id="fecha-desde"
          type="date"
          value={fechaDesde}
          onChange={(event) => onFechaDesdeChange(event.target.value)}
          aria-label="Filtrar sesiones desde una fecha"
          className="animales-filtros__input"
        />
      </div>

      <div className="sesiones-filtros__campo">
        <label htmlFor="fecha-hasta" className="sr-only">
          Filtrar hasta
        </label>
        <Input
          id="fecha-hasta"
          type="date"
          value={fechaHasta}
          onChange={(event) => onFechaHastaChange(event.target.value)}
          aria-label="Filtrar sesiones hasta una fecha"
          className="animales-filtros__input"
        />
      </div>

      <button
        type="button"
        className="sesiones-filtros__clear"
        onClick={onClear}
        disabled={!estado && !fechaDesde && !fechaHasta}>
        Limpiar filtros
      </button>
    </div>
  );
}
