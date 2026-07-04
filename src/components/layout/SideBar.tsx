import { useAuth } from "@/features/auth";
import { NavLink } from "react-router-dom";
import { DashboardIcon, RodeoIcon, EvaluacionesIcon } from "@/utils/icons";

const navItems = [
  { label: "Inicio", to: "/dashboard", icon: <DashboardIcon /> },
  { label: "Animales", to: "/animales", icon: <RodeoIcon /> },
  { label: "Evaluaciones", to: "/evaluaciones", icon: <EvaluacionesIcon /> },
];

export function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <p>VACCA</p> <span>Gestión bovina</span>
      </div>
      <nav className="sidebar__nav">
        {navItems.map(({ label, to, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar__link${isActive ? " sidebar__link--active" : ""}`
            }
          >
            <span className="sidebar__icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <button className="sidebar__logout" onClick={logout}>
        Cerrar sesión
      </button>
    </aside>
  );
}
