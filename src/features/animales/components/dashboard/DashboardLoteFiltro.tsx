import { useEffect, useMemo, useState } from "react";
import { Menu, Portal } from "@chakra-ui/react";
import { IconChevronDown } from "@tabler/icons-react";
import { getLotes } from "@/features/lotes/services/lotesService";
import type { LoteOption } from "@/features/lotes/types";
import { CATEGORIAS_ANIMAL } from "@/features/animales/constants";
import type { CategoriaAnimal } from "@/features/animales/types";

const TODOS_VALUE = "__TODOS__";
const TODAS_CATEGORIAS_VALUE = "__TODAS__";

type Props = {
  loteId: number | null;
  onChange: (id: number | null) => void;
};

export function DashboardLoteFiltro({ loteId, onChange }: Props) {
  const [lotes, setLotes] = useState<LoteOption[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(true);
  const [categoriaLote, setCategoriaLote] = useState<CategoriaAnimal | null>(
    null,
  );

  useEffect(() => {
    getLotes()
      .then(setLotes)
      .finally(() => setLoadingLotes(false));
  }, []);

  const lotesFiltrados = useMemo(
    () =>
      categoriaLote
        ? lotes.filter((lote) => lote.categoria === categoriaLote)
        : lotes,
    [lotes, categoriaLote],
  );

  const categoriaLabel = CATEGORIAS_ANIMAL.find(
    (c) => c.value === categoriaLote,
  )?.label;

  const label =
    loteId === null
      ? "Todos los lotes"
      : (lotesFiltrados.find((l) => l.id === loteId)?.nombre ??
        "Lote desconocido");

  return (
    <>
      <Menu.Root>
        <Menu.Trigger asChild>
          <button
            type="button"
            className="animales-filtros__dropdown"
            aria-label="Filtrar dashboard por categoría de lote">
            <span>{categoriaLabel ?? "Todas las categorías"}</span>
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
                  setCategoriaLote(
                    value === TODAS_CATEGORIAS_VALUE
                      ? null
                      : (value as CategoriaAnimal),
                  );
                  onChange(null);
                }}>
                <Menu.RadioItem value={TODAS_CATEGORIAS_VALUE}>
                  Todas las categorías
                </Menu.RadioItem>
                <Menu.Separator />
                {CATEGORIAS_ANIMAL.map(({ value, label: catLabel }) => (
                  <Menu.RadioItem key={value} value={value}>
                    {catLabel}
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
            aria-label="Filtrar dashboard por lote"
            disabled={loadingLotes}>
            <span>{label}</span>
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
                value={loteId === null ? TODOS_VALUE : String(loteId)}
                onValueChange={(details) => {
                  const value = details.value;
                  onChange(value === TODOS_VALUE ? null : Number(value));
                }}>
                <Menu.RadioItem value={TODOS_VALUE}>
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
    </>
  );
}
