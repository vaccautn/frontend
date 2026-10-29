import { Button } from "@chakra-ui/react";
import { IconArrowRight, IconArrowsMaximize } from "@tabler/icons-react";
import { AgregarAnimalMenu } from "@/features/animales/components/AgregarAnimalMenu";

type Props = {
  hasSel: boolean;
  onVerDashboard: () => void;
  onAgregarAnimal: () => void;
  onImportarAnimales: () => void;
};

export function RodeoPanelFooter({
  hasSel,
  onVerDashboard,
  onAgregarAnimal,
  onImportarAnimales,
}: Props) {
  return (
    <div className="rodeo-panel__footer">
      {hasSel ? (
        <Button width="100%" colorPalette="brand" onClick={onVerDashboard}>
          Ver detalle del lote
          <IconArrowRight size={16} />
        </Button>
      ) : (
        <>
          <Button flex="1" variant="outline" onClick={onVerDashboard}>
            Ver dashboard
            <IconArrowsMaximize size={16} />
          </Button>
          <AgregarAnimalMenu
            placement="top-end"
            onAgregar={onAgregarAnimal}
            onImportar={onImportarAnimales}
          />
        </>
      )}
    </div>
  );
}
