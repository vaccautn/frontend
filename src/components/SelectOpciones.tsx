import { Portal, Select, createListCollection } from "@chakra-ui/react";
import { useMemo } from "react";

type Opcion = { value: string; label: string };

type SelectOpcionesProps = {
  opciones: Opcion[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  "aria-label"?: string;
};

/** Desplegable con el estilo de Chakra (en vez de la lista nativa del
 * navegador). */
export function SelectOpciones({
  opciones,
  value,
  onChange,
  placeholder,
  disabled,
  "aria-label": ariaLabel,
}: SelectOpcionesProps) {
  const collection = useMemo(
    () => createListCollection({ items: opciones }),
    [opciones],
  );

  return (
    <Select.Root
      collection={collection}
      value={value ? [value] : []}
      onValueChange={(details) => onChange(details.value[0] ?? "")}
      disabled={disabled}
      colorPalette="brand"
      positioning={{ sameWidth: true }}>
      <Select.HiddenSelect aria-label={ariaLabel} />
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder={placeholder} />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {collection.items.map((opcion) => (
              <Select.Item item={opcion} key={opcion.value}>
                {opcion.label}
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}
