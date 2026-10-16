import type { ReactNode } from "react";
import { IconArrowsMaximize, IconX } from "@tabler/icons-react";

type Props = {
  breadcrumb: ReactNode;
  onExpand: () => void;
  onClose: () => void;
};

export function RodeoPanelHeader({ breadcrumb, onExpand, onClose }: Props) {
  return (
    <div className="rodeo-panel__header">
      {breadcrumb}
      <div className="rodeo-panel__header-botones">
        <button
          type="button"
          className="rodeo-panel__header-boton"
          onClick={onExpand}
          title="Pantalla completa">
          <IconArrowsMaximize size={16} stroke={1.75} />
        </button>
        <button
          type="button"
          className="rodeo-panel__header-boton"
          onClick={onClose}
          title="Cerrar panel">
          <IconX size={16} stroke={1.75} />
        </button>
      </div>
    </div>
  );
}
