import { useEffect, useState } from "react";
import { Menu, Portal } from "@chakra-ui/react";
import { IconChevronDown } from "@tabler/icons-react";
import { getLotes } from "@/features/lotes/services/lotesService";
import type { LoteOption } from "@/features/lotes/types";

type Props = {
  loteId: number | null;
  onChange: (id: number | null) => void;
};

export function DashboardLoteFiltro({ loteId, onChange }: Props) {
  const [lotes, setLotes] = useState<LoteOption[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(true);

  useEffect(() => {
    getLotes()
      .then(setLotes)
      .finally(() => setLoadingLotes(false));
  }, []);

  const label =
    loteId === null
      ? "Todos los lotes"
      : (lotes.find((l) => l.id === loteId)?.nombre ?? "Lote desconocido");

  return (
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
            <Menu.Item value="" onSelect={() => onChange(null)}>
              Todos los lotes
            </Menu.Item>
            <Menu.Separator />
            {lotes.map((lote) => (
              <Menu.Item
                key={lote.id}
                value={String(lote.id)}
                onSelect={() => onChange(lote.id)}>
                {lote.nombre}
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
