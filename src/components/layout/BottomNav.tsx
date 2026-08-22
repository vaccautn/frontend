import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Dialog } from "@chakra-ui/react";
import { IconList, IconChartBar, IconSettings } from "@tabler/icons-react";

const navItems = [
  {
    label: "Animales",
    to: "/animales",
    icon: <IconList size={22} stroke={1.5} />,
  },
  {
    label: "Sesiones",
    to: "/sesiones",
    icon: <IconChartBar size={22} stroke={1.5} />,
  },
];

export function BottomNav() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {navItems.map(({ label, to, icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `bottom-nav__link${isActive ? " bottom-nav__link--active" : ""}`
          }>
          <span className="bottom-nav__icon">{icon}</span>
          {label}
        </NavLink>
      ))}

      <Dialog.Root
        open={isSettingsOpen}
        onOpenChange={(details) => setIsSettingsOpen(details.open)}>
        <Dialog.Trigger asChild>
          <button className="bottom-nav__link" type="button">
            <span className="bottom-nav__icon">
              <IconSettings size={22} stroke={1.5} />
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
    </nav>
  );
}
