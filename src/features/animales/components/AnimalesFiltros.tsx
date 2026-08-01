import { Input, Menu, Portal } from "@chakra-ui/react";
import { IconChevronDown } from "@tabler/icons-react";
import { RAZAS, ESTADOS_FILTRO } from "@/features/animales/constants";
import type { EstadoFiltro } from "@/features/animales/types";
import type { LoteOption } from "@/features/lotes/types";

const TODAS_RAZAS_VALUE = "__TODAS__";
const TODOS_ESTADOS_VALUE = "__TODOS__";
const TODOS_LOTES_VALUE = "__TODOS__";

interface AnimalesFiltrosProps {
  caravanaInput: string;
  sexo: "MACHO" | "HEMBRA" | null;
  raza: string | null;
  estado: EstadoFiltro | null;
  loteId: number | null;
  lotes: LoteOption[];
  loadingLotes: boolean;
  onCaravanaChange: (value: string) => void;
  onSexoChange: (value: "MACHO" | "HEMBRA" | null) => void;
  onRazaChange: (value: string | null) => void;
  onEstadoChange: (value: EstadoFiltro | null) => void;
  onLoteChange: (value: number | null) => void;
}

export function AnimalesFiltros({
  caravanaInput,
  sexo,
  raza,
  estado,
  loteId,
  lotes,
  loadingLotes,
  onCaravanaChange,
  onSexoChange,
  onRazaChange,
  onEstadoChange,
  onLoteChange,
}: AnimalesFiltrosProps) {
  const estadoLabel = ESTADOS_FILTRO.find((e) => e.value === estado)?.label;
  const loteLabel = lotes.find((l) => l.id === loteId)?.nombre;

  return (
    <div
      className="animales-filtros"
      role="search"
      aria-label="Filtros de animales">
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

      <div
        className="animales-filtros__toggle"
        role="group"
        aria-label="Filtrar por sexo">
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
            aria-label="Filtrar por lote"
            disabled={loadingLotes}>
            <span>{loteLabel ?? "Todos los lotes"}</span>
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
                value={loteId === null ? TODOS_LOTES_VALUE : String(loteId)}
                onValueChange={(details) => {
                  const value = details.value;
                  onLoteChange(
                    value === TODOS_LOTES_VALUE ? null : Number(value),
                  );
                }}>
                <Menu.RadioItem value={TODOS_LOTES_VALUE}>
                  Todos los lotes
                </Menu.RadioItem>
                <Menu.Separator />
                {lotes.map((lote) => (
                  <Menu.RadioItem key={lote.id} value={String(lote.id)}>
                    {lote.nombre}
                  </Menu.RadioItem>
                ))}
              </Menu.RadioItemGroup>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>

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
              <Menu.RadioItemGroup
                value={raza ?? TODAS_RAZAS_VALUE}
                onValueChange={(details) => {
                  const value = details.value;
                  onRazaChange(value === TODAS_RAZAS_VALUE ? null : value);
                }}>
                <Menu.RadioItem value={TODAS_RAZAS_VALUE}>
                  Todas las razas
                </Menu.RadioItem>
                <Menu.Separator />
                {RAZAS.map((r) => (
                  <Menu.RadioItem key={r} value={r}>
                    {r}
                  </Menu.RadioItem>
                ))}
              </Menu.RadioItemGroup>
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
              <Menu.RadioItemGroup
                value={estado ?? TODOS_ESTADOS_VALUE}
                onValueChange={(details) => {
                  const value = details.value;
                  onEstadoChange(
                    value === TODOS_ESTADOS_VALUE
                      ? null
                      : (value as EstadoFiltro),
                  );
                }}>
                <Menu.RadioItem value={TODOS_ESTADOS_VALUE}>
                  Todos
                </Menu.RadioItem>
                <Menu.Separator />
                {ESTADOS_FILTRO.map(({ value, label }) => (
                  <Menu.RadioItem key={value} value={value}>
                    {label}
                  </Menu.RadioItem>
                ))}
              </Menu.RadioItemGroup>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </div>
  );
}
