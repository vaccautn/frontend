import type { AuthUser } from "../types/authTypes";

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
