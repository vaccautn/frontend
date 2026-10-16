import { Button } from "@chakra-ui/react";
import {
  IconArrowRight,
  IconArrowsMaximize,
  IconPlus,
} from "@tabler/icons-react";

type Props = {
  hasSel: boolean;
  onVerDashboard: () => void;
  onAgregarAnimal: () => void;
};

export function RodeoPanelFooter({
  hasSel,
  onVerDashboard,
  onAgregarAnimal,
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
          <Button flex="1" colorPalette="brand" onClick={onAgregarAnimal}>
            <IconPlus size={16} />
            Agregar animal
          </Button>
        </>
      )}
    </div>
  );
}
