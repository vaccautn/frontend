import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Avatar,
  Dialog,
  IconButton,
  Menu,
  Portal,
  Tooltip,
} from "@chakra-ui/react";
import {
  // IconHome2,
  IconList,
  IconChartBar,
  IconCalendarHeart,
  IconMap,
  IconMenu2,
  IconSettings,
  IconChevronDown,
  IconLogout,
} from "@tabler/icons-react";
import { ConfiguracionCargaForm } from "@/features/mapa/components/ConfiguracionCargaForm";
import { getStoredUser, useAuth } from "@/features/auth";

const navItems = [
  // {
  //   label: "Inicio",
  //   to: "/dashboard",
  //   icon: <IconHome2 size={20} stroke={1} />,
  // },
  {
    label: "Animales",
    to: "/animales",
    icon: <IconList size={20} stroke={1} />,
  },
  {
    label: "Sesiones",
    to: "/sesiones",
    icon: <IconChartBar size={20} stroke={1} />,
  },
  {
    label: "Servicios",
    to: "/servicios",
    icon: <IconCalendarHeart size={20} stroke={1} />,
  },
  {
    label: "Mapa",
    to: "/mapa",
    icon: <IconMap size={20} stroke={1} />,
  },
];

type SidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
};

function getInitials(nombre: string, apellido: string) {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const user = getStoredUser();
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const toggleLabel = isOpen
    ? "Contraer menú lateral"
    : "Expandir menú lateral";

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
    <aside
      className={`sidebar${isOpen ? "" : " sidebar--collapsed"}`}
      aria-label="Navegación principal">
      <div className="sidebar__top">
        {isOpen && (
          <div className="sidebar__brand">
            <p>VACCA</p> <span>Gestión bovina</span>
          </div>
        )}
        <IconButton
          aria-label={toggleLabel}
          title={toggleLabel}
          variant="ghost"
          colorPalette="brand"
          size="md"
          onClick={onToggle}>
          <IconMenu2 size={24} stroke={1.75} />
        </IconButton>
      </div>

      <nav className="sidebar__nav">
        {navItems.map(({ label, to, icon }) => {
          const isActive = pathname === to || pathname.startsWith(`${to}/`);
          return (
            <Tooltip.Root
              key={to}
              disabled={isOpen}
              openDelay={100}
              positioning={{ placement: "right" }}>
              <Tooltip.Trigger asChild>
                <NavLink
                  to={to}
                  className={`sidebar__link${isActive ? " sidebar__link--active" : ""}`}>
                  <span className="sidebar__icon">{icon}</span>
                  {isOpen && label}
                </NavLink>
              </Tooltip.Trigger>
              <Portal>
                <Tooltip.Positioner>
                  <Tooltip.Content className="sidebar__tooltip">
                    {label}
                  </Tooltip.Content>
                </Tooltip.Positioner>
              </Portal>
            </Tooltip.Root>
          );
        })}
      </nav>

      {user && (
        <Menu.Root>
          <Menu.Trigger asChild>
            <button
              type="button"
              className="sidebar__user"
              title={`${user.nombre} ${user.apellido} · ${user.rol}`}>
              <Avatar.Root size="sm" colorPalette="brand">
                <Avatar.Fallback>
                  {getInitials(user.nombre, user.apellido)}
                </Avatar.Fallback>
              </Avatar.Root>
              {isOpen && (
                <>
                  <div className="sidebar__user-info">
                    <span className="sidebar__user-name">
                      {user.nombre} {user.apellido}
                    </span>
                    <span className="sidebar__user-role">{user.rol}</span>
                  </div>
                  <IconChevronDown
                    className="sidebar__user-caret"
                    size={16}
                    stroke={1.5}
                  />
                </>
              )}
            </button>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content className="sidebar__user-menu">
                {/* <Menu.Item
                  value="editar-perfil"
                  onSelect={() => {
                    // TODO: sin funcionalidad todavía, no existe la página de perfil.
                  }}>
                  <IconUserEdit stroke={1.5} size={18} />
                  Editar perfil
                </Menu.Item> */}
                <Menu.Item
                  value="configuracion"
                  onSelect={() => setIsSettingsOpen(true)}>
                  <IconSettings stroke={1.5} size={18} />
                  Configuración
                </Menu.Item>
                <Menu.Separator />
                <Menu.Item
                  value="cerrar-sesion"
                  className="sidebar__user-menu-item--danger"
                  onSelect={() => setIsLogoutConfirmOpen(true)}>
                  <IconLogout stroke={1.5} size={18} />
                  Cerrar sesión
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      )}

      <Dialog.Root
        open={isSettingsOpen}
        onOpenChange={(details) => setIsSettingsOpen(details.open)}>
        <Dialog.Backdrop className="sidebar__settings-backdrop" />
        <Dialog.Positioner>
          <Dialog.Content className="sidebar__settings-dialog">
            <Dialog.Header>
              <Dialog.Title>Configuración</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <ConfiguracionCargaForm />
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <button
                type="button"
                className="sidebar__settings-close"
                aria-label="Cerrar">
                x
              </button>
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

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
    </aside>
  );
}
