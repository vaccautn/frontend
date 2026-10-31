import type { AuthUser } from "../types/authTypes.ts";

const authStorageKeys = {
  accessToken: "auth.accessToken",
  tokenType: "auth.tokenType",
  user: "auth.user",
};

export function saveSession(
  accessToken: string,
  tokenType: string,
  user: AuthUser,
) {
  localStorage.setItem(authStorageKeys.accessToken, accessToken);
  localStorage.setItem(authStorageKeys.tokenType, tokenType);
  localStorage.setItem(authStorageKeys.user, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(authStorageKeys.accessToken);
  localStorage.removeItem(authStorageKeys.tokenType);
  localStorage.removeItem(authStorageKeys.user);
}

export function getAccessToken() {
  return localStorage.getItem(authStorageKeys.accessToken);
}

export function getStoredUser() {
  const rawUser = localStorage.getItem(authStorageKeys.user);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    return null;
  }
}

/** true si el JWT ya venció (o no se puede leer su vencimiento). */
export function tokenVencido(token: string): boolean {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(payload)) as { exp?: number };
    return typeof exp !== "number" || Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

// Aviso para el login: se marca al cerrar la sesión por vencimiento y la
// pantalla de login lo muestra una vez.
const AVISO_SESION_VENCIDA = "auth.sesionVencida";

export function marcarSesionVencida() {
  sessionStorage.setItem(AVISO_SESION_VENCIDA, "1");
}

export function consumirAvisoSesionVencida(): boolean {
  const hayAviso = sessionStorage.getItem(AVISO_SESION_VENCIDA) === "1";
  sessionStorage.removeItem(AVISO_SESION_VENCIDA);
  return hayAviso;
}
