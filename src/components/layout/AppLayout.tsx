import "./layout.css";
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./SideBar";
import { BottomNav } from "./BottomNav";
import { BuscadorAnimales } from "@/features/animales/components/BuscadorAnimales";
import { ToastContainer, type IconProps } from "react-toastify";
import {
  IconAlertTriangle,
  IconCheck,
  IconInfoSmall,
  IconX,
} from "@tabler/icons-react";

const ICONOS_TOAST = {
  success: IconCheck,
  error: IconX,
  warning: IconAlertTriangle,
  info: IconInfoSmall,
};

/** Ícono de los toasts: círculo del color del tipo (verde éxito, rojo
 * error de la paleta) con el glifo en blanco. */
function ToastIcono({ type }: IconProps) {
  if (type === "default") return null;
  const Icono = ICONOS_TOAST[type];
  return (
    <span className={`toast-icono toast-icono--${type}`}>
      <Icono size={type === "info" ? 22 : 15} stroke={2.75} />
    </span>
  );
}

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { pathname } = useLocation();
  // Full-bleed solo para la pantalla de Rodeo en sí (y su drawer hijo "nuevo") — NO para
  // /rodeo/:id (detalle de animal), que es una página hermana con layout normal.
  const isFullBleed = pathname === "/rodeo" || pathname.startsWith("/rodeo/nuevo");

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((open) => !open)}
      />
      <div className="app-shell__main">
        <header className="app-shell__topbar">
          <BuscadorAnimales />
        </header>
        <div className="app-shell__card">
          <main
            className={`app-shell__content${isFullBleed ? " app-shell__content--full" : ""}`}>
            <div
              className={`app-shell__content-inner${isFullBleed ? " app-shell__content-inner--full" : ""}`}>
              <Outlet />
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} icon={ToastIcono} />
    </div>
  );
}
