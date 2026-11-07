import { useSearchParams } from "react-router-dom";
import type { EvaluacionCC } from "../types";

export function useEvaluacionesFiltradas(evaluaciones: EvaluacionCC[]) {
  const [params, setParams] = useSearchParams();
  const desde = params.get("evalDesde") ?? "";
  const hasta = params.get("evalHasta") ?? "";
  const cc = params.get("evalCC") ?? "";
  const setFiltro = (key: string, value: string) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("evalPage");
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  };
  const filtradas = evaluaciones.filter((e) => {
    const fecha = e.fecha.slice(0, 10);
    return (
      (!desde || fecha >= desde) &&
      (!hasta || fecha <= hasta) &&
      (!cc || e.valor_cc === Number(cc))
    );
  });
  const filtros = (
    <div
      className="evaluaciones-filtros"
      role="group"
      aria-label="Filtrar evaluaciones"
    >
      <label>
        Desde
        <input
          type="date"
          value={desde}
          max={hasta || undefined}
          onChange={(e) => setFiltro("evalDesde", e.target.value)}
        />
      </label>
      <label>
        Hasta
        <input
          type="date"
          value={hasta}
          min={desde || undefined}
          onChange={(e) => setFiltro("evalHasta", e.target.value)}
        />
      </label>
      <label>
        Calificación
        <select
          value={cc}
          onChange={(e) => setFiltro("evalCC", e.target.value)}
        >
          <option value="">Todas</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              CC {n}
            </option>
          ))}
        </select>
      </label>
      {(desde || hasta || cc) && (
        <button
          type="button"
          onClick={() =>
            setParams(
              (current) => {
                const next = new URLSearchParams(current);
                ["evalDesde", "evalHasta", "evalCC"].forEach((key) =>
                  next.delete(key),
                );
                return next;
              },
              { replace: true, preventScrollReset: true },
            )
          }
        >
          Limpiar filtros
        </button>
      )}
      <span role="status">
        {filtradas.length} de {evaluaciones.length} evaluaciones
      </span>
      {desde && hasta && desde > hasta && (
        <p role="alert">La fecha desde debe ser anterior a la fecha hasta.</p>
      )}
    </div>
  );
  return { filtradas, filtros };
}
