import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";
import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";

import { DashboardPage } from "@/pages/Dashboard";
import { RodeoPage } from "@/pages/rodeo/RodeoPage";
import { EvaluacionesPage } from "@/pages/Evaluaciones";
import RodeoNuevoPage from "@/pages/rodeo/RodeoNuevoPage";

export const router = createBrowserRouter([
  // Si ya estas logeado la ruta publica te lleva directo al dashboard
  {
    element: <PublicRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },
  // Si no estas logeado la ruta privada te lleva directo al login
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          {
            path: "/rodeo",
            element: <RodeoPage />,
            children: [{ path: "nuevo", element: <RodeoNuevoPage /> }],
          },
          { path: "/rodeo/nuevo", element: <RodeoNuevoPage /> },
          { path: "/evaluaciones", element: <EvaluacionesPage /> },
        ],
      },
    ],
  },

  { path: "/", element: <Navigate to="/dashboard" replace /> },
  // 404 -> Deberia haber una pag de 404 en vez de dashboard
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);
