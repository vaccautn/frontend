import type { ChangeEvent } from "react";
import { Input, NativeSelect } from "@chakra-ui/react";
import { RAZAS, ESTADOS_FILTRO } from "@/features/animales/constants";
import type { EstadoFiltro } from "@/features/animales/types";

interface AnimalesFiltrosProps {
  caravanaInput: string;
  sexo: "MACHO" | "HEMBRA" | null;
  raza: string | null;
  estado: EstadoFiltro | null;
  onCaravanaChange: (value: string) => void;
  onSexoChange: (value: "MACHO" | "HEMBRA" | null) => void;
  onRazaChange: (value: string | null) => void;
  onEstadoChange: (value: EstadoFiltro | null) => void;
}

export function AnimalesFiltros({
  caravanaInput,
  sexo,
  raza,
  estado,
  onCaravanaChange,
  onSexoChange,
  onRazaChange,
  onEstadoChange,
}: AnimalesFiltrosProps) {
  const handleRazaChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onRazaChange(event.target.value || null);
  };

  const handleEstadoChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onEstadoChange((event.target.value as EstadoFiltro) || null);
  };

  return (
    <div className="animales-filtros" role="search" aria-label="Filtros de animales">
      <div className="animales-filtros__campo">
        <label htmlFor="buscar-caravana" className="sr-only">
          Buscar por caravana
        </label>
        <Input
          id="buscar-caravana"
          type="search"
          placeholder="Buscar caravana…"
          value={caravanaInput}
          onChange={(event) => onCaravanaChange(event.target.value)}
          aria-label="Buscar por número de caravana"
          className="animales-filtros__input"
        />
      </div>

      <div className="animales-filtros__toggle" role="group" aria-label="Filtrar por sexo">
        <button
          type="button"
          className={`animales-filtros__toggle-btn animales-filtros__toggle-btn--macho${
            sexo === "MACHO" ? " animales-filtros__toggle-btn--activo" : ""
          }`}
          aria-pressed={sexo === "MACHO"}
          aria-label="Filtrar por macho"
          title="Macho"
          onClick={() => onSexoChange(sexo === "MACHO" ? null : "MACHO")}>
          ♂
        </button>
        <button
          type="button"
          className={`animales-filtros__toggle-btn animales-filtros__toggle-btn--hembra${
            sexo === "HEMBRA" ? " animales-filtros__toggle-btn--activo" : ""
          }`}
          aria-pressed={sexo === "HEMBRA"}
          aria-label="Filtrar por hembra"
          title="Hembra"
          onClick={() => onSexoChange(sexo === "HEMBRA" ? null : "HEMBRA")}>
          ♀
        </button>
      </div>

      <NativeSelect.Root className="animales-filtros__select">
        <NativeSelect.Field
          aria-label="Filtrar por raza"
          value={raza ?? ""}
          onChange={handleRazaChange}>
          <option value="">Todas las razas</option>
          {RAZAS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>

      <NativeSelect.Root className="animales-filtros__select">
        <NativeSelect.Field
          aria-label="Filtrar por estado"
          value={estado ?? ""}
          onChange={handleEstadoChange}>
          <option value="">Todos</option>
          {ESTADOS_FILTRO.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </div>
  );
}
