import { Input, Menu, Portal } from "@chakra-ui/react";
import { IconChevronDown } from "@tabler/icons-react";
import { RAZAS, ESTADOS_FILTRO } from "@/features/animales/constants";
import type { EstadoFiltro } from "@/features/animales/types";

interface AnimalesFiltrosProps {
  caravanaInput: string;
  sexo: "MACHO" | "HEMBRA" | null;
  raza: string | null;
  estado: EstadoFiltro | null;
  onCaravanaChange: (value: string) => void;
  onSexoChange: (value: "MACHO" | "HEMBRA" | null) => void;
  onRazaChange: (value: string | null) => void;
  onEstadoChange: (value: EstadoFiltro | null) => void;
}

export function AnimalesFiltros({
  caravanaInput,
  sexo,
  raza,
  estado,
  onCaravanaChange,
  onSexoChange,
  onRazaChange,
  onEstadoChange,
}: AnimalesFiltrosProps) {
  const estadoLabel = ESTADOS_FILTRO.find((e) => e.value === estado)?.label;

  return (
    <div className="animales-filtros" role="search" aria-label="Filtros de animales">
      <div className="animales-filtros__campo">
        <label htmlFor="buscar-caravana" className="sr-only">
          Buscar por caravana
        </label>
        <Input
          id="buscar-caravana"
          type="search"
          placeholder="Buscar caravana…"
          value={caravanaInput}
          onChange={(event) => onCaravanaChange(event.target.value)}
          aria-label="Buscar por número de caravana"
          className="animales-filtros__input"
        />
      </div>

      <div className="animales-filtros__toggle" role="group" aria-label="Filtrar por sexo">
        <button
          type="button"
          className={`animales-filtros__toggle-btn animales-filtros__toggle-btn--macho${
            sexo === "MACHO" ? " animales-filtros__toggle-btn--activo" : ""
          }`}
          aria-pressed={sexo === "MACHO"}
          aria-label="Filtrar por macho"
          title="Macho"
          onClick={() => onSexoChange(sexo === "MACHO" ? null : "MACHO")}>
          ♂
        </button>
        <button
          type="button"
          className={`animales-filtros__toggle-btn animales-filtros__toggle-btn--hembra${
            sexo === "HEMBRA" ? " animales-filtros__toggle-btn--activo" : ""
          }`}
          aria-pressed={sexo === "HEMBRA"}
          aria-label="Filtrar por hembra"
          title="Hembra"
          onClick={() => onSexoChange(sexo === "HEMBRA" ? null : "HEMBRA")}>
          ♀
        </button>
      </div>

      <Menu.Root>
        <Menu.Trigger asChild>
          <button
            type="button"
            className="animales-filtros__dropdown"
            aria-label="Filtrar por raza">
            <span>{raza ?? "Todas las razas"}</span>
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
              <Menu.Item value="" onSelect={() => onRazaChange(null)}>
                Todas las razas
              </Menu.Item>
              <Menu.Separator />
              {RAZAS.map((r) => (
                <Menu.Item key={r} value={r} onSelect={() => onRazaChange(r)}>
                  {r}
                </Menu.Item>
              ))}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>

      <Menu.Root>
        <Menu.Trigger asChild>
          <button
            type="button"
            className="animales-filtros__dropdown"
            aria-label="Filtrar por estado">
            <span>{estadoLabel ?? "Todos"}</span>
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
                Todos
              </Menu.Item>
              <Menu.Separator />
              {ESTADOS_FILTRO.map(({ value, label }) => (
                <Menu.Item
                  key={value}
                  value={value}
                  onSelect={() => onEstadoChange(value as EstadoFiltro)}>
                  {label}
                </Menu.Item>
              ))}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </div>
  );
}
