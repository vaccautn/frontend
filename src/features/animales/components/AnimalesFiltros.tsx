import { useState } from "react";
import { Input, Menu, Portal } from "@chakra-ui/react";
import { IconCalendarEvent, IconChevronDown } from "@tabler/icons-react";
import {
  RAZAS,
  ESTADOS_FILTRO,
  CATEGORIAS_ANIMAL,
} from "@/features/animales/constants";
import type { CategoriaAnimal, EstadoFiltro } from "@/features/animales/types";
import {
  PRESETS_ALTA,
  etiquetaFiltroAlta,
  type FiltroAlta,
} from "@/features/animales/utils/filtroAlta";
import { RangoAltaDialog } from "./RangoAltaDialog";

export type LoteFiltroOption = {
  id: number;
  nombre: string;
  categoria: CategoriaAnimal;
};

const TODAS_RAZAS_VALUE = "__TODAS__";
const TODOS_ESTADOS_VALUE = "__TODOS__";
const TODOS_LOTES_VALUE = "__TODOS__";
const TODAS_CATEGORIAS_VALUE = "__TODAS__";
const CUALQUIER_ALTA_VALUE = "__CUALQUIERA__";
const RANGO_ALTA_VALUE = "rango";

export type CampoFiltroAnimales = "caravana" | "categoria" | "lote" | "raza" | "estado" | "alta";

const TODOS_LOS_CAMPOS: CampoFiltroAnimales[] = [
  "caravana",
  "categoria",
  "lote",
  "raza",
  "estado",
  "alta",
];

const NOOP = () => {};

interface AnimalesFiltrosProps {
  caravanaInput: string;
  raza?: string | null;
  estado?: EstadoFiltro | null;
  loteId?: number | null;
  categoriaLote: CategoriaAnimal | null;
  /** Fecha de alta en el sistema (null = cualquiera). */
  alta?: FiltroAlta | null;
  lotes?: LoteFiltroOption[];
  loadingLotes?: boolean;
  onCaravanaChange: (value: string) => void;
  onRazaChange?: (value: string | null) => void;
  onEstadoChange?: (value: EstadoFiltro | null) => void;
  onLoteChange?: (value: number | null) => void;
  onCategoriaLoteChange: (value: CategoriaAnimal | null) => void;
  onAltaChange?: (value: FiltroAlta | null) => void;
  /** Subconjunto de campos a mostrar. Por defecto, todos. */
  camposVisibles?: CampoFiltroAnimales[];
}

export function AnimalesFiltros({
  caravanaInput,
  raza = null,
  estado = null,
  loteId = null,
  categoriaLote,
  alta = null,
  lotes = [],
  loadingLotes = false,
  onCaravanaChange,
  onRazaChange = NOOP,
  onEstadoChange = NOOP,
  onLoteChange = NOOP,
  onCategoriaLoteChange,
  onAltaChange = NOOP,
  camposVisibles = TODOS_LOS_CAMPOS,
}: AnimalesFiltrosProps) {
  const [rangoAbierto, setRangoAbierto] = useState(false);
  const mostrar = (campo: CampoFiltroAnimales) =>
    camposVisibles.includes(campo);
  const estadoLabel = ESTADOS_FILTRO.find((e) => e.value === estado)?.label;
  const categoriaLoteLabel = CATEGORIAS_ANIMAL.find(
    (c) => c.value === categoriaLote,
  )?.label;
  const lotesFiltrados = categoriaLote
    ? lotes.filter((lote) => lote.categoria === categoriaLote)
    : lotes;
  const loteLabel = lotesFiltrados.find((l) => l.id === loteId)?.nombre;

  return (
    <div
      className="animales-filtros"
      role="search"
      aria-label="Filtros de animales">
      {mostrar("caravana") && (
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
      )}

      {mostrar("categoria") && (
        <Menu.Root>
          <Menu.Trigger asChild>
            <button
              type="button"
              className="animales-filtros__dropdown"
              aria-label="Filtrar por categoría de lote">
              <span>{categoriaLoteLabel ?? "Todas las categorías"}</span>
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
                  value={categoriaLote ?? TODAS_CATEGORIAS_VALUE}
                  onValueChange={(details) => {
                    const value = details.value;
                    onCategoriaLoteChange(
                      value === TODAS_CATEGORIAS_VALUE
                        ? null
                        : (value as CategoriaAnimal),
                    );
                  }}>
                  <Menu.RadioItem value={TODAS_CATEGORIAS_VALUE}>
                    Todas las categorías
                  </Menu.RadioItem>
                  <Menu.Separator />
                  {CATEGORIAS_ANIMAL.map(({ value, label }) => (
                    <Menu.RadioItem key={value} value={value}>
                      {label}
                    </Menu.RadioItem>
                  ))}
                </Menu.RadioItemGroup>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      )}

      {mostrar("lote") && (
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
                  {lotesFiltrados.map((lote) => (
                    <Menu.RadioItem key={lote.id} value={String(lote.id)}>
                      {lote.nombre}
                    </Menu.RadioItem>
                  ))}
                </Menu.RadioItemGroup>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      )}

      {mostrar("raza") && (
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
      )}

      {mostrar("estado") && (
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
      )}

      {mostrar("alta") && (
        <Menu.Root>
          <Menu.Trigger asChild>
            <button
              type="button"
              className="animales-filtros__dropdown animales-filtros__dropdown--alta"
              data-activo={alta ? true : undefined}
              aria-label="Filtrar por fecha de alta">
              <IconCalendarEvent className="animales-filtros__dropdown-icono" size={16} stroke={1.5} />
              <span>{etiquetaFiltroAlta(alta)}</span>
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
                  value={alta?.tipo ?? CUALQUIER_ALTA_VALUE}
                  onValueChange={(details) => {
                    const value = details.value;
                    if (value === RANGO_ALTA_VALUE) setRangoAbierto(true);
                    else if (value === CUALQUIER_ALTA_VALUE) onAltaChange(null);
                    else onAltaChange({ tipo: value as Exclude<FiltroAlta["tipo"], "rango"> });
                  }}>
                  <Menu.RadioItem value={CUALQUIER_ALTA_VALUE}>
                    Cualquier fecha de alta
                  </Menu.RadioItem>
                  <Menu.Separator />
                  {PRESETS_ALTA.map(({ tipo, etiqueta }) => (
                    <Menu.RadioItem key={tipo} value={tipo}>
                      {etiqueta}
                    </Menu.RadioItem>
                  ))}
                  <Menu.Separator />
                  <Menu.RadioItem value={RANGO_ALTA_VALUE}>Elegir fechas…</Menu.RadioItem>
                </Menu.RadioItemGroup>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      )}

      {rangoAbierto && (
        <RangoAltaDialog
          open
          desdeInicial={alta?.tipo === "rango" ? alta.desde : ""}
          hastaInicial={alta?.tipo === "rango" ? alta.hasta : ""}
          onCancelar={() => setRangoAbierto(false)}
          onAplicar={(desde, hasta) => {
            setRangoAbierto(false);
            onAltaChange({ tipo: "rango", desde, hasta });
          }}
        />
      )}
    </div>
  );
}
