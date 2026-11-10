import { lazy } from "react";

export const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
export const InicioPage = lazy(() =>
  import("@/pages/InicioPage").then((module) => ({
    default: module.InicioPage,
  })),
);
export const RodeoPage = lazy(() =>
  import("@/pages/RodeoPage").then((module) => ({ default: module.RodeoPage })),
);
export const AnimalDetailPage = lazy(() =>
  import("@/pages/AnimalDetailPage").then((module) => ({
    default: module.AnimalDetailPage,
  })),
);
export const SesionesPage = lazy(() =>
  import("@/pages/SesionesPage").then((module) => ({
    default: module.SesionesPage,
  })),
);
export const CargarEvaluacionesPage = lazy(() =>
  import("@/pages/CargarEvaluacionPage").then((module) => ({
    default: module.CargarEvaluacionesPage,
  })),
);
export const SesionDetailPage = lazy(() =>
  import("@/pages/SesionDetailPage").then((module) => ({
    default: module.SesionDetailPage,
  })),
);
export const ServiciosPage = lazy(() =>
  import("@/pages/ServiciosPage").then((module) => ({
    default: module.ServiciosPage,
  })),
);
export const ServicioDetailPage = lazy(() =>
  import("@/pages/ServicioDetailPage").then((module) => ({
    default: module.ServicioDetailPage,
  })),
);
export const CrearReservicioPage = lazy(() =>
  import("@/pages/CrearReservicioPage").then((module) => ({
    default: module.CrearReservicioPage,
  })),
);
export const ServicioNuevoPage = lazy(() => import("@/pages/ServicioNuevoPage"));
export const AnimalesNuevoPage = lazy(() => import("@/pages/AnimalesNuevoPage"));
export const ImportarAnimalesPage = lazy(() =>
  import("@/pages/ImportarAnimalesPage").then((module) => ({
    default: module.ImportarAnimalesPage,
  })),
);
export const LandingPage = lazy(() =>
  import("@/pages/LandingPage").then((module) => ({
    default: module.LandingPage,
  })),
);
export const ActividadPage = lazy(() =>
  import("@/pages/ActividadPage").then((module) => ({
    default: module.ActividadPage,
  })),
);
export const CamposPage = lazy(() =>
  import("@/pages/CamposPage").then((module) => ({
    default: module.CamposPage,
  })),
);
export const CargaTablaPage = lazy(() =>
  import("@/pages/CargaTablaPage").then((module) => ({
    default: module.CargaTablaPage,
  })),
);
export const LoginPage = lazy(() => import("@/pages/LoginPage"));
