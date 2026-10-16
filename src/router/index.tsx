import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";
import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "@/pages/LoginPage";
// import RegisterPage from "@/pages/RegisterPage";

import { DashboardPage } from "@/pages/Dashboard";
import { RodeoPage } from "@/pages/RodeoPage";
import { AnimalDetailPage } from "@/pages/AnimalDetailPage";
import { SesionesPage } from "@/pages/SesionesPage";

import AnimalesNuevoPage from "@/pages/AnimalesNuevoPage";
import { CargarEvaluacionesPage } from "@/pages/CargarEvaluacionPage";
import { SesionDetailPage } from "@/pages/SesionDetailPage";
import { ServiciosPage } from "@/pages/ServiciosPage";
import { ServicioDetailPage } from "@/pages/ServicioDetailPage";
import { CrearReservicioPage } from "@/pages/CrearReservicioPage";
import ServicioNuevoPage from "@/pages/ServicioNuevoPage";
import { RedirectAnimalDetail } from "./RedirectAnimalDetail";

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
            path: "/rodeo",
            element: <RodeoPage />,
            children: [{ path: "nuevo", element: <AnimalesNuevoPage /> }],
          },
          { path: "/rodeo/:id", element: <AnimalDetailPage /> },
          { path: "/animales", element: <Navigate to="/rodeo" replace /> },
          { path: "/animales/nuevo", element: <Navigate to="/rodeo/nuevo" replace /> },
          { path: "/animales/:id", element: <RedirectAnimalDetail /> },
          { path: "/mapa", element: <Navigate to="/rodeo" replace /> },
          {
            path: "/sesiones",
            element: <SesionesPage />,
            // children: [{ path: "nuevo", element: <AnimalesNuevoPage /> }],
          },

          { path: "/sesiones/:id", element: <SesionDetailPage /> },
          { path: "/sesiones/:id/cargar", element: <CargarEvaluacionesPage /> },

          {
            path: "/servicios",
            element: <ServiciosPage />,
            children: [{ path: "nuevo", element: <ServicioNuevoPage /> }],
          },
          { path: "/servicios/:id", element: <ServicioDetailPage /> },
          {
            path: "/servicios/:id/reservicio",
            element: <CrearReservicioPage />,
          },
        ],
      },
    ],
  },

  { path: "/", element: <Navigate to="/rodeo" replace /> },
  // 404 -> Deberia haber una pag de 404 en vez de rodeo
  { path: "*", element: <Navigate to="/rodeo" replace /> },
]);
