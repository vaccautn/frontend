import { Input } from "@chakra-ui/react";

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
        <label htmlFor="fecha-desde" className="sr-only">
          Filtrar desde
        </label>
        <Input
          id="fecha-desde"
          type="date"
          value={fechaDesde}
          onChange={(event) => onFechaDesdeChange(event.target.value)}
          aria-label="Filtrar sesiones desde una fecha"
          className="animales-filtros__input"
        />
      </div>

      <div className="sesiones-filtros__campo">
        <label htmlFor="fecha-hasta" className="sr-only">
          Filtrar hasta
        </label>
        <Input
          id="fecha-hasta"
          type="date"
          value={fechaHasta}
          onChange={(event) => onFechaHastaChange(event.target.value)}
          aria-label="Filtrar sesiones hasta una fecha"
          className="animales-filtros__input"
        />
      </div>

      <button
        type="button"
        className="sesiones-filtros__clear"
        onClick={onClear}
        disabled={!fechaDesde && !fechaHasta}>
        Limpiar filtros
      </button>
    </div>
  );
}
