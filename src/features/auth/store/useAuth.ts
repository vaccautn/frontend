import { createContext, useContext } from "react";
import type { AuthUser } from "../types/authTypes";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  refreshSession: () => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
