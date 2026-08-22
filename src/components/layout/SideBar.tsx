import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Dialog, IconButton } from "@chakra-ui/react";
import {
  // IconHome2,
  IconList,
  IconChartBar,
  IconMenu2,
  IconSettings,
} from "@tabler/icons-react";

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
];

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <aside
      className={`sidebar${isOpen ? "" : " sidebar--closed"}`}
      aria-hidden={!isOpen}
      inert={!isOpen || undefined}>
      <div className="sidebar__top">
        <div className="sidebar__brand">
          <p>VACCA</p> <span>Gestión bovina</span>
        </div>
        <IconButton
          aria-label="Ocultar menú lateral"
          variant="ghost"
          colorPalette="brand"
          size="md"
          onClick={onClose}>
          <IconMenu2 size={24} stroke={1.75} />
        </IconButton>
      </div>

      <nav className="sidebar__nav">
        {navItems.map(({ label, to, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar__link${isActive ? " sidebar__link--active" : ""}`
            }>
            <span className="sidebar__icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <Dialog.Root
        open={isSettingsOpen}
        onOpenChange={(details) => setIsSettingsOpen(details.open)}>
        <Dialog.Trigger asChild>
          <button className="sidebar__settings" type="button">
            <span className="sidebar__icon">
              <IconSettings size={20} stroke={1} />
            </span>
            Configuración
          </button>
        </Dialog.Trigger>
        <Dialog.Backdrop className="sidebar__settings-backdrop" />
        <Dialog.Positioner>
          <Dialog.Content className="sidebar__settings-dialog">
            <Dialog.Header>
              <Dialog.Title>Configuración</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body />
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
    </aside>
  );
}
