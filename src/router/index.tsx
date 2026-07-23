import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";
import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "@/pages/LoginPage";
// import RegisterPage from "@/pages/RegisterPage";

import { DashboardPage } from "@/pages/Dashboard";
import { AnimalesPage } from "@/pages/animales/AnimalesPage";
import { AnimalDetailPage } from "@/pages/animales/AnimalDetailPage";
import { SesionesPage } from "@/pages/sesiones/SesionesPage";

import AnimalesNuevoPage from "@/pages/animales/AnimalesNuevoPage";
import { CargarEvaluacionesPage } from "@/pages/sesiones/CargarEvaluacionPage";
import { SesionDetailPage } from "@/pages/sesiones/SesionDetailPage";

export const router = createBrowserRouter([
  // Si ya estas logeado la ruta publica te lleva directo al dashboard
  {
    element: <PublicRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      // { path: "/register", element: <RegisterPage /> },
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
            path: "/animales",
            element: <AnimalesPage />,
            children: [{ path: "nuevo", element: <AnimalesNuevoPage /> }],
          },
          { path: "/animales/:id", element: <AnimalDetailPage /> },
          {
            path: "/sesiones",
            element: <SesionesPage />,
            // children: [{ path: "nuevo", element: <AnimalesNuevoPage /> }],
          },

          { path: "/sesiones/:id", element: <SesionDetailPage /> },
          { path: "/sesiones/:id/cargar", element: <CargarEvaluacionesPage /> },
        ],
      },
    ],
  },

  { path: "/", element: <Navigate to="/dashboard" replace /> },
  // 404 -> Deberia haber una pag de 404 en vez de dashboard
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);
