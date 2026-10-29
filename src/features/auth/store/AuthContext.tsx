import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { AuthUser } from "../types/authTypes";
import {
  getAccessToken,
  getStoredUser,
  clearSession,
  marcarSesionVencida,
  tokenVencido,
} from "./authSession";
import { logoutProducer } from "../services/authService";
import { SESION_VENCIDA_EVENT } from "@/services/httpClient";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  refreshSession: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // La sesión se lee al crear el estado (localStorage es sincrónico), así el
  // primer render ya sabe si hay usuario. Un token vencido no es una sesión:
  // se descarta antes de que la app empiece a pedir datos y mostrar errores.
  const [user, setUser] = useState<AuthUser | null>(() => {
    const token = getAccessToken();
    if (token && tokenVencido(token)) {
      clearSession();
      marcarSesionVencida();
      return null;
    }
    return getStoredUser();
  });

  // El backend rechazó el token en medio del uso (venció mientras la app
  // estaba abierta): se cierra la sesión y ProtectedRoute lleva al login.
  useEffect(() => {
    const alVencer = () => {
      clearSession();
      marcarSesionVencida();
      setUser(null);
    };
    window.addEventListener(SESION_VENCIDA_EVENT, alVencer);
    return () => window.removeEventListener(SESION_VENCIDA_EVENT, alVencer);
  }, []);

  const refreshSession = () => {
    setUser(getStoredUser());
  };

  const logout = async () => {
    try {
      await logoutProducer();
    } catch {
      // si falla el server, pasa al finally y se ciera igual la sesion
    } finally {
      clearSession();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, refreshSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
