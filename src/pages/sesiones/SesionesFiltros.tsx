import { Input, Menu, Portal } from "@chakra-ui/react";
import { IconCalendarWeek, IconChevronDown } from "@tabler/icons-react";
import type { EstadoSesion } from "@/features/sesiones/types";

const TODOS_VALUE = "__TODOS__";

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
    <div
      className="sesiones-filtros"
      role="search"
      aria-label="Filtros de sesiones">
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
              <Menu.RadioItemGroup
                value={estado ?? TODOS_VALUE}
                onValueChange={(details) => {
                  const value = details.value;
                  onEstadoChange(
                    value === TODOS_VALUE ? null : (value as EstadoSesion),
                  );
                }}>
                <Menu.RadioItem value={TODOS_VALUE}>
                  Todos los estados
                </Menu.RadioItem>
                <Menu.Separator />
                {ESTADOS.map(({ value, label }) => (
                  <Menu.RadioItem key={value} value={value}>
                    {label}
                  </Menu.RadioItem>
                ))}
              </Menu.RadioItemGroup>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>

      <div
        className="sesiones-filtros__rango"
        role="group"
        aria-label="Filtrar por rango de fechas">
        <label htmlFor="fecha-desde" className="sesiones-filtros__rango-label">
          Desde
        </label>
        <Input
          id="fecha-desde"
          type="date"
          value={fechaDesde}
          onChange={(event) => onFechaDesdeChange(event.target.value)}
          aria-label="Filtrar sesiones desde una fecha"
          className="sesiones-filtros__rango-input"
        />

        <span className="sesiones-filtros__rango-divisor" aria-hidden="true" />

        <label htmlFor="fecha-hasta" className="sesiones-filtros__rango-label">
          Hasta
        </label>
        <Input
          id="fecha-hasta"
          type="date"
          value={fechaHasta}
          onChange={(event) => onFechaHastaChange(event.target.value)}
          aria-label="Filtrar sesiones hasta una fecha"
          className="sesiones-filtros__rango-input"
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
