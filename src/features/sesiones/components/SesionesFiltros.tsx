import { FechaInput } from "@/components/FechaInput";

type SesionesFiltrosProps = {
  fechaDesde: string;
  fechaHasta: string;
  onFechaDesdeChange: (value: string) => void;
  onFechaHastaChange: (value: string) => void;
  onClear: () => void;
};

export function SesionesFiltros({
  fechaDesde,
  fechaHasta,
  onFechaDesdeChange,
  onFechaHastaChange,
  onClear,
}: SesionesFiltrosProps) {
  return (
    <div className="sesiones-filtros" role="search" aria-label="Filtros de sesiones">
      <div className="sesiones-filtros__campo">
        <label htmlFor="fecha-desde" className="sesiones-filtros__campo-label">
          Desde
        </label>
        <FechaInput
          id="fecha-desde"
          value={fechaDesde}
          onChange={onFechaDesdeChange}
          aria-label="Filtrar sesiones desde una fecha"
          className="animales-filtros__input"
        />
      </div>

      <div className="sesiones-filtros__campo">
        <label htmlFor="fecha-hasta" className="sesiones-filtros__campo-label">
          Hasta
        </label>
        <FechaInput
          id="fecha-hasta"
          value={fechaHasta}
          onChange={onFechaHastaChange}
          aria-label="Filtrar sesiones hasta una fecha"
          className="animales-filtros__input"
        />
      </div>

      {(fechaDesde || fechaHasta) && (
        <button type="button" className="sesiones-filtros__clear" onClick={onClear}>
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
