import { lazy, Suspense } from "react";
import { Outlet } from "react-router-dom";
import { ErrorPage } from "@/pages/ErrorPage";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";
import AppLayout from "@/components/layout/AppLayout";
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));

import { RedirectAnimalDetail } from "./RedirectAnimalDetail";

const InicioPage = lazy(() =>
  import("@/pages/InicioPage").then((module) => ({
    default: module.InicioPage,
  })),
);
const RodeoPage = lazy(() =>
  import("@/pages/RodeoPage").then((module) => ({ default: module.RodeoPage })),
);
const AnimalDetailPage = lazy(() =>
  import("@/pages/AnimalDetailPage").then((module) => ({
    default: module.AnimalDetailPage,
  })),
);
const SesionesPage = lazy(() =>
  import("@/pages/SesionesPage").then((module) => ({
    default: module.SesionesPage,
  })),
);
const CargarEvaluacionesPage = lazy(() =>
  import("@/pages/CargarEvaluacionPage").then((module) => ({
    default: module.CargarEvaluacionesPage,
  })),
);
const SesionDetailPage = lazy(() =>
  import("@/pages/SesionDetailPage").then((module) => ({
    default: module.SesionDetailPage,
  })),
);
const ServiciosPage = lazy(() =>
  import("@/pages/ServiciosPage").then((module) => ({
    default: module.ServiciosPage,
  })),
);
const ServicioDetailPage = lazy(() =>
  import("@/pages/ServicioDetailPage").then((module) => ({
    default: module.ServicioDetailPage,
  })),
);
const CrearReservicioPage = lazy(() =>
  import("@/pages/CrearReservicioPage").then((module) => ({
    default: module.CrearReservicioPage,
  })),
);
const ServicioNuevoPage = lazy(() => import("@/pages/ServicioNuevoPage"));
const AnimalesNuevoPage = lazy(() => import("@/pages/AnimalesNuevoPage"));
const ImportarAnimalesPage = lazy(() =>
  import("@/pages/ImportarAnimalesPage").then((module) => ({
    default: module.ImportarAnimalesPage,
  })),
);
const LandingPage = lazy(() =>
  import("@/pages/LandingPage").then((module) => ({
    default: module.LandingPage,
  })),
);
const ActividadPage = lazy(() =>
  import("@/pages/ActividadPage").then((module) => ({
    default: module.ActividadPage,
  })),
);
const CamposPage = lazy(() =>
  import("@/pages/CamposPage").then((module) => ({
    default: module.CamposPage,
  })),
);
const CargaTablaPage = lazy(() =>
  import("@/pages/CargaTablaPage").then((module) => ({
    default: module.CargaTablaPage,
  })),
);
const LoginPage = lazy(() => import("@/pages/LoginPage"));
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
