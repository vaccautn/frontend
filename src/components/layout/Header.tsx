import { useState } from "react";
import { getStoredUser, useAuth } from "@/features/auth";
import { useLocation } from "react-router-dom";
import { Avatar, Dialog, IconButton, Menu, Portal } from "@chakra-ui/react";
import {
  IconMenu2,
  IconChevronDown,
  IconLogout,
  IconUserEdit,
} from "@tabler/icons-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Inicio",
  "/evaluaciones": "Evaluaciones de condición corporal",
};

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/animales")) {
    return "Información de animales";
  }

  return pageTitles[pathname] ?? "Sin título";
}

type HeaderProps = {
  isSidebarOpen: boolean;
  onOpenSidebar: () => void;
};

function getInitials(nombre: string, apellido: string) {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

export function Header({ isSidebarOpen, onOpenSidebar }: HeaderProps) {
  const user = getStoredUser();
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const title = getPageTitle(pathname);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      setIsLogoutConfirmOpen(false);
    }
  };

  return (
    <header className="header">
      <div className="header__start">
        {!isSidebarOpen && (
          <IconButton
            aria-label="Mostrar menú lateral"
            variant="ghost"
            colorPalette="brand"
            size="md"
            className="header__menu-toggle"
            onClick={onOpenSidebar}>
            <IconMenu2 size={24} stroke={1.75} />
          </IconButton>
        )}
        <h1 className="header__title">{title}</h1>
      </div>

      <div className="header__actions">
        {/* Aca va los toggles Escala 1-5 / 1-9 y notificaciones */}
        {user && (
          <Menu.Root>
            <Menu.Trigger asChild>
              <button type="button" className="header__user">
                <Avatar.Root size="sm" colorPalette="brand">
                  <Avatar.Fallback>
                    {getInitials(user.nombre, user.apellido)}
                  </Avatar.Fallback>
                </Avatar.Root>
                <div className="header__user-info">
                  <span className="header__user-name">
                    {user.nombre} {user.apellido}
                  </span>
                  <span className="header__user-role">{user.rol}</span>
                </div>
                <IconChevronDown
                  className="header__user-caret"
                  size={16}
                  stroke={1.5}
                />
              </button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content className="header__user-menu">
                  <Menu.Item
                    value="editar-perfil"
                    onSelect={() => {
                      // TODO: sin funcionalidad todavía, no existe la página de perfil.
                    }}>
                    <IconUserEdit stroke={1.5} size={18} />
                    Editar perfil
                  </Menu.Item>
                  <Menu.Separator />
                  <Menu.Item
                    value="cerrar-sesion"
                    className="header__user-menu-item--danger"
                    onSelect={() => setIsLogoutConfirmOpen(true)}>
                    <IconLogout stroke={1.5} size={18} />
                    Cerrar sesión
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        )}
      </div>

      <Dialog.Root
        open={isLogoutConfirmOpen}
        onOpenChange={(details) => setIsLogoutConfirmOpen(details.open)}
        role="alertdialog">
        <Portal>
          <Dialog.Backdrop className="logout-confirm__backdrop" />
          <Dialog.Positioner>
            <Dialog.Content className="logout-confirm">
              <Dialog.Header>
                <Dialog.Title>Cerrar sesión</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <p>¿Estás seguro de que querés cerrar sesión?</p>
              </Dialog.Body>
              <Dialog.Footer className="logout-confirm__footer">
                <button
                  type="button"
                  className="logout-confirm__cancel"
                  onClick={() => setIsLogoutConfirmOpen(false)}
                  disabled={isLoggingOut}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="logout-confirm__confirm"
                  onClick={handleConfirmLogout}
                  disabled={isLoggingOut}>
                  {isLoggingOut ? "Cerrando..." : "Cerrar sesión"}
                </button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </header>
  );
}
