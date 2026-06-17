import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth";

export function PublicRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
