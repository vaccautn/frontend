import { NavLink } from "react-router-dom";
import { DashboardIcon, RodeoIcon, EvaluacionesIcon } from "@/utils/icons";

const navItems = [
  { label: "Panel general", to: "/dashboard", icon: <DashboardIcon /> },
  { label: "Rodeo", to: "/rodeo", icon: <RodeoIcon /> },
  { label: "Evaluaciones", to: "/evaluaciones", icon: <EvaluacionesIcon /> },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">VACCA</div>
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
    </aside>
  );
}
