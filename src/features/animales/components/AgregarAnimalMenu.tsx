import { Menu, Portal } from "@chakra-ui/react";
import { IconFileSpreadsheet, IconSquareRoundedPlus } from "@tabler/icons-react";
import { BotonAgregar } from "@/components/ui/BotonAgregar";
import { VacaIcon } from "@/utils/icons";
import "./agregar-animal-menu.css";

type Props = {
  onAgregar: () => void;
  onImportar: () => void;
  /** Hacia dónde se abre el menú: junto a un título "bottom-start", en un
   * pie de panel "top-end". */
  placement?: "bottom-start" | "bottom-end" | "top-end";
};

/** Botón con una vaquita y un "+" que ofrece cargar un animal o importar
 * varios desde una planilla. */
export function AgregarAnimalMenu({
  onAgregar,
  onImportar,
  placement = "bottom-end",
}: Props) {
  return (
    <Menu.Root positioning={{ placement, gutter: 10 }}>
      <Menu.Trigger asChild>
        <BotonAgregar icono={<VacaIcon size={24} />} label="Agregar animales" />
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content className="agregar-animal__menu">
            <Menu.Item value="agregar" onSelect={onAgregar}>
              <span className="agregar-animal__icono">
                <IconSquareRoundedPlus size={18} stroke={1.75} />
              </span>
              <span className="agregar-animal__texto">
                <strong>Agregar animal</strong>
                <span>Cargá uno con el formulario</span>
              </span>
            </Menu.Item>
            <Menu.Item value="importar" onSelect={onImportar}>
              <span className="agregar-animal__icono">
                <IconFileSpreadsheet size={18} stroke={1.75} />
              </span>
              <span className="agregar-animal__texto">
                <strong>Importar desde archivo</strong>
                <span>Subí una planilla CSV o Excel</span>
              </span>
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
