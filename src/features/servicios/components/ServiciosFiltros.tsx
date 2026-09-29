import { Menu, Portal } from "@chakra-ui/react";
import { FechaInput } from "@/components/FechaInput";
import { IconChevronDown } from "@tabler/icons-react";
import { ESTADOS_SERVICIO } from "@/features/servicios/constants";
import type { EstadoServicio } from "@/features/servicios/types";

const TODOS_ESTADOS_VALUE = "__TODOS__";

type ServiciosFiltrosProps = {
  estado: EstadoServicio | null;
  fechaDesde: string;
  fechaHasta: string;
  onEstadoChange: (value: EstadoServicio | null) => void;
  onFechaDesdeChange: (value: string) => void;
  onFechaHastaChange: (value: string) => void;
  onClear: () => void;
};

export function ServiciosFiltros({
  estado,
  fechaDesde,
  fechaHasta,
  onEstadoChange,
  onFechaDesdeChange,
  onFechaHastaChange,
  onClear,
}: ServiciosFiltrosProps) {
  const estados = ESTADOS_SERVICIO.filter((e) => e.value !== "CANCELADO");
  const estadoLabel = estados.find((e) => e.value === estado)?.label;

  return (
    <div
      className="sesiones-filtros"
      role="search"
      aria-label="Filtros de servicios">
      <div className="sesiones-filtros__campo">
        <label htmlFor="servicio-fecha-desde" className="sr-only">
          Filtrar desde
        </label>
        <FechaInput
          id="servicio-fecha-desde"
          value={fechaDesde}
          onChange={onFechaDesdeChange}
          aria-label="Filtrar servicios desde una fecha de inicio"
          className="animales-filtros__input"
        />
      </div>

      <div className="sesiones-filtros__campo">
        <label htmlFor="servicio-fecha-hasta" className="sr-only">
          Filtrar hasta
        </label>
        <FechaInput
          id="servicio-fecha-hasta"
          value={fechaHasta}
          onChange={onFechaHastaChange}
          aria-label="Filtrar servicios hasta una fecha de inicio"
          className="animales-filtros__input"
        />
      </div>

      <Menu.Root>
        <Menu.Trigger asChild>
          <button
            type="button"
            className="animales-filtros__dropdown"
            aria-label="Filtrar por estado del servicio">
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
                value={estado ?? TODOS_ESTADOS_VALUE}
                onValueChange={(details) => {
                  const value = details.value;
                  onEstadoChange(
                    value === TODOS_ESTADOS_VALUE
                      ? null
                      : (value as EstadoServicio),
                  );
                }}>
                <Menu.RadioItem value={TODOS_ESTADOS_VALUE}>
                  Todos los estados
                </Menu.RadioItem>
                <Menu.Separator />
                {estados.map(({ value, label }) => (
                  <Menu.RadioItem key={value} value={value}>
                    {label}
                  </Menu.RadioItem>
                ))}
              </Menu.RadioItemGroup>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>

      {(estado || fechaDesde || fechaHasta) && (
        <button type="button" className="sesiones-filtros__clear" onClick={onClear}>
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
