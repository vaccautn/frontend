import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";
import "./error-page.css";

export function ErrorPage({ notFound = false }: { notFound?: boolean }) {
  const error = useRouteError();
  const missing =
    notFound || (isRouteErrorResponse(error) && error.status === 404);
  return (
    <main className="error-page">
      <section aria-labelledby="error-title">
        <p className="eyebrow">VACCA · {missing ? "404" : "Algo salió mal"}</p>
        <h1 id="error-title">
          {missing ? "Esta página no existe" : "No pudimos abrir esta pantalla"}
        </h1>
        <p>
          {missing
            ? "Revisá el enlace o volvé al inicio para continuar."
            : "Podés intentar nuevamente. Tus datos guardados se conservan."}
        </p>
        <div className="error-page__actions">
          {!missing && (
            <button type="button" onClick={() => window.location.reload()}>
              Reintentar
            </button>
          )}
          <Link to="/inicio">Ir al inicio</Link>
          <Link to="/landing">Conocer el proyecto</Link>
        </div>
      </section>
    </main>
  );
}
