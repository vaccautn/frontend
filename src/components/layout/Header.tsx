import { getStoredUser } from "@/features/auth";

export function Header() {
  const user = getStoredUser();

  return (
    <header className="header">
      <h1 className="header__title">Rodeo</h1>
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
