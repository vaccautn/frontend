import type { ReactNode } from "react";
import { Button, CloseButton, Popover, Portal } from "@chakra-ui/react";
import { IconId } from "@tabler/icons-react";
import "./ficha.css";

type FichaProps = {
  titulo: string;
  abierta: boolean;
  onAbiertaChange: (abierta: boolean) => void;
  /** Mientras se edita, un click afuera (por ejemplo en el calendario, que
   * va en otro portal) no cierra la ficha. */
  editando?: boolean;
  children: ReactNode;
};

/** Ficha de datos: un botón que abre un panel flotante sobre el contenido
 * (no lo desplaza), con título, filas etiqueta–valor y acciones. */
export function Ficha({
  titulo,
  abierta,
  onAbiertaChange,
  editando = false,
  children,
}: FichaProps) {
  return (
    <Popover.Root
      open={abierta}
      onOpenChange={(details) => onAbiertaChange(details.open)}
      closeOnInteractOutside={!editando}
      positioning={{ placement: "bottom-start", gutter: 8 }}
      lazyMount
      unmountOnExit>
      <Popover.Trigger asChild>
        <Button variant="outline" bg="var(--panel)" className="ficha__trigger">
          <IconId size={18} stroke={1.5} />
          {abierta ? "Ocultar ficha" : "Ver ficha"}
        </Button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content
            className={`ficha${editando ? " ficha--editando" : ""}`}>
            <div className="ficha__header">
              <Popover.Title className="ficha__titulo">{titulo}</Popover.Title>
              <Popover.CloseTrigger asChild>
                <CloseButton size="sm" aria-label="Cerrar ficha" />
              </Popover.CloseTrigger>
            </div>
            {children}
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}

export type FichaFila = {
  label: string;
  /** null o "" muestra el texto de vacío, atenuado. */
  valor: string | null;
  vacio?: string;
};

/** Filas etiqueta (izquierda) – valor (derecha) separadas por filetes. */
export function FichaFilas({ filas }: { filas: FichaFila[] }) {
  return (
    <dl className="ficha__filas">
      {filas.map(({ label, valor, vacio = "—" }) => (
        <div key={label} className="ficha__fila">
          <dt>{label}</dt>
          <dd className={valor ? undefined : "ficha__valor--vacio"}>
            {valor || vacio}
          </dd>
        </div>
      ))}
    </dl>
  );
}
