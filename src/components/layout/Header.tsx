import { getStoredUser } from "@/features/auth";
import { useLocation } from "react-router-dom";

const pageTitles: Record<string, string> = {
  "/dashboard": "Panel general",
  "/evaluaciones": "Evaluaciones de condición corporal",
};

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/rodeo")) {
    return "Información del rodeo";
  }

  return pageTitles[pathname] ?? "Sin título";
}

export function Header() {
  const user = getStoredUser();
  const { pathname } = useLocation();

  const title = getPageTitle(pathname);

  return (
    <header className="header">
      <h1 className="header__title">{title}</h1>

      <div className="header__actions">
        {/* Aca va los toggles Escala 1-5 / 1-9 y notificaciones */}
        {user && (
          <div className="header__user">
            <span className="header__user-name">
              {user.nombre} {user.apellido}
            </span>
            <span className="header__user-role">{user.rol}</span>
          </div>
        )}
      </div>
    </header>
  );
}
