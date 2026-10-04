import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { IconLoader2, IconMapPin, IconSearch, IconX } from "@tabler/icons-react";

type LocalidadGeoref = {
  id: string;
  nombre: string;
  departamento: { id: string; nombre: string };
  provincia: { id: string; nombre: string };
  centroide: { lat: number; lon: number };
};

type Props = {
  onSelectLocalidad: (coordenadas: { lon: number; lat: number; nombre: string }) => void;
};

export function BuscadorLocalidad({ onSelectLocalidad }: Props) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<LocalidadGeoref[]>([]);
  const [cargando, setCargando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement | null>(null);

  // Cerrar el dropdown al hacer click afuera
  useEffect(() => {
    const handleClickAfuera = (event: MouseEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(event.target as Node)) {
        setAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickAfuera);
    return () => document.removeEventListener("mousedown", handleClickAfuera);
  }, []);

  // Búsqueda con debounce en la API de Georef Argentina
  useEffect(() => {
    const texto = query.trim();
    if (texto.length < 3) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setCargando(true);
      try {
        const url = `https://apis.datos.gob.ar/georef/api/localidades?nombre=${encodeURIComponent(
          texto,
        )}&max=6`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error("Error en la búsqueda");
        const data = await res.json();
        setResultados(data.localidades ?? []);
        setAbierto(true);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setResultados([]);
        }
      } finally {
        setCargando(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleSeleccionar = (loc: LocalidadGeoref) => {
    onSelectLocalidad({
      lon: loc.centroide.lon,
      lat: loc.centroide.lat,
      nombre: loc.nombre,
    });
    setQuery(loc.nombre);
    setAbierto(false);
  };

  const handleLimpiar = () => {
    setQuery("");
    setResultados([]);
    setAbierto(false);
  };

  return (
    <div ref={contenedorRef} className="mapa-buscador">
      <div className="mapa-buscador__input-wrapper">
        <IconSearch size={16} className="mapa-buscador__icon-search" />
        <input
          type="text"
          className="mapa-buscador__input"
          placeholder="Buscar localidad o paraje (Argentina)..."
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            setQuery(val);
            if (val.trim().length < 3) {
              setResultados([]);
              setAbierto(false);
            } else if (!abierto) {
              setAbierto(true);
            }
          }}
          onFocus={() => {
            if (resultados.length > 0) setAbierto(true);
          }}
        />
        {cargando && <IconLoader2 size={16} className="mapa-buscador__spinner" />}
        {!cargando && query && (
          <button
            type="button"
            className="mapa-buscador__btn-limpiar"
            onClick={handleLimpiar}
            title="Limpiar búsqueda">
            <IconX size={14} />
          </button>
        )}
      </div>

      {abierto && query.trim().length >= 3 && (
        <ul className="mapa-buscador__dropdown">
          {resultados.length === 0 && !cargando ? (
            <li className="mapa-buscador__item mapa-buscador__item--vacio">
              No se encontraron localidades
            </li>
          ) : (
            resultados.map((loc) => (
              <li
                key={loc.id}
                className="mapa-buscador__item"
                onClick={() => handleSeleccionar(loc)}>
                <IconMapPin size={15} className="mapa-buscador__pin" />
                <div className="mapa-buscador__info">
                  <span className="mapa-buscador__nombre">{loc.nombre}</span>
                  <span className="mapa-buscador__detalle">
                    {loc.departamento.nombre} &bull; {loc.provincia.nombre}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
