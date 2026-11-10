import { RegisterPage, InicioPage, RodeoPage, AnimalDetailPage, SesionesPage, CargarEvaluacionesPage, SesionDetailPage, ServiciosPage, ServicioDetailPage, CrearReservicioPage, ServicioNuevoPage, AnimalesNuevoPage, ImportarAnimalesPage, LandingPage, ActividadPage, CamposPage, CargaTablaPage, LoginPage } from "./LazyPages";
import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { ErrorPage } from "@/pages/ErrorPage";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";
import AppLayout from "@/components/layout/AppLayout";

import { RedirectAnimalDetail } from "./RedirectAnimalDetail";

export const router = createBrowserRouter([
  {
    element: (
      <Suspense fallback={<p role="status">Cargando pantalla…</p>}>
        <Outlet />
      </Suspense>
    ),
    errorElement: <ErrorPage />,
    children: [
      // Landing publica: accesible con o sin sesion
      { path: "/landing", element: <LandingPage /> },

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
              { path: "/inicio", element: <InicioPage /> },
              { path: "/actividad", element: <ActividadPage /> },
              { path: "/campo", element: <CamposPage /> },
              { path: "/rodeo/carga-tabla", element: <CargaTablaPage /> },
              {
                path: "/rodeo",
                element: <RodeoPage />,
                children: [{ path: "nuevo", element: <AnimalesNuevoPage /> }],
              },
              { path: "/rodeo/importar", element: <ImportarAnimalesPage /> },
              { path: "/rodeo/:id", element: <AnimalDetailPage /> },
              { path: "/animales", element: <Navigate to="/rodeo" replace /> },
              {
                path: "/animales/nuevo",
                element: <Navigate to="/rodeo/nuevo" replace />,
              },
              { path: "/animales/:id", element: <RedirectAnimalDetail /> },
              { path: "/mapa", element: <Navigate to="/rodeo" replace /> },
              {
                path: "/sesiones",
                element: <SesionesPage />,
                // children: [{ path: "nuevo", element: <AnimalesNuevoPage /> }],
              },

              { path: "/sesiones/:id", element: <SesionDetailPage /> },
              {
                path: "/sesiones/:id/cargar",
                element: <CargarEvaluacionesPage />,
              },

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

      { path: "/", element: <Navigate to="/inicio" replace /> },
      // 404 -> Deberia haber una pag de 404 en vez de inicio
      { path: "*", element: <ErrorPage notFound /> },
    ],
  },
]);
