import { Button, Dialog, Portal } from "@chakra-ui/react";
import type { ReactNode } from "react";
import "@/features/sesiones/components/sesiones.css";

type Props = {
  open: boolean;
  titulo: string;
  children: ReactNode;
  confirmar?: string;
  pendiente?: boolean;
  peligro?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};
export function ConfirmacionDialog({ open, titulo, children, confirmar = "Confirmar", pendiente = false, peligro = false, onClose, onConfirm }: Props) {
  return <Dialog.Root open={open} onOpenChange={event => { if (!event.open && !pendiente) onClose(); }}>
    <Portal><Dialog.Backdrop className="sesion-edit__backdrop" /><Dialog.Positioner><Dialog.Content className="sesion-edit__dialog">
      <Dialog.Header><Dialog.Title>{titulo}</Dialog.Title></Dialog.Header>
      <Dialog.Body>{children}</Dialog.Body>
      <Dialog.Footer><Button variant="ghost" disabled={pendiente} onClick={onClose}>Cancelar</Button><Button colorPalette={peligro ? "red" : "brand"} loading={pendiente} disabled={pendiente} onClick={onConfirm}>{confirmar}</Button></Dialog.Footer>
    </Dialog.Content></Dialog.Positioner></Portal>
  </Dialog.Root>;
}
