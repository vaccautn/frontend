import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Combobox, Portal, createListCollection } from "@chakra-ui/react";
import {
  IconCornerDownLeft,
  IconGenderFemale,
  IconGenderMale,
  IconSearch,
} from "@tabler/icons-react";
import { getLotes } from "@/features/lotes/services/lotesService";
import { getAnimales } from "../services/animalesService";
import { CATEGORIA_ANIMAL_LABELS } from "../constants";
import type { Animal } from "../types";
import "./buscador-animales.css";

const DEBOUNCE_MS = 250;
const MAX_RESULTADOS = 8;

const caravanaDe = (animal: Animal) => animal.caravana ?? `#${animal.id}`;

/** Buscador de animales por caravana, siempre a mano arriba del contenido.
 * Elegir un resultado abre el detalle del animal. */
export function BuscadorAnimales() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [resultados, setResultados] = useState<Animal[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [nombreLote, setNombreLote] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    getLotes()
      .then((lotes) => setNombreLote(new Map(lotes.map((l) => [l.id, l.nombre]))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const texto = query.trim().toLowerCase();
    if (!texto) return;
    let cancelado = false;
    const timer = window.setTimeout(() => {
      getAnimales({ caravana: texto })
        .then((animales) => {
          if (cancelado) return;
          // Primero las caravanas que empiezan con lo escrito.
          const empieza = (a: Animal) =>
            caravanaDe(a).toLowerCase().startsWith(texto) ? 0 : 1;
          setResultados(
            [...animales]
              .sort((a, b) => empieza(a) - empieza(b))
              .slice(0, MAX_RESULTADOS),
          );
        })
        .catch(() => !cancelado && setResultados([]))
        .finally(() => !cancelado && setBuscando(false));
    }, DEBOUNCE_MS);
    return () => {
      cancelado = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const collection = useMemo(
    () =>
      createListCollection({
        items: resultados,
        itemToString: caravanaDe,
        itemToValue: (animal) => String(animal.id),
      }),
    [resultados],
  );

  return (
    <Combobox.Root
      className="buscador-animales"
      collection={collection}
      inputValue={query}
      onInputValueChange={({ inputValue }) => {
        setQuery(inputValue);
        const hayTexto = inputValue.trim() !== "";
        setBuscando(hayTexto);
        if (!hayTexto) setResultados([]);
      }}
      open={abierto && query.trim() !== ""}
      onOpenChange={({ open }) => setAbierto(open)}
      value={[]}
      onSelect={({ itemValue }) => {
        setQuery("");
        setResultados([]);
        inputRef.current?.blur();
        navigate(`/rodeo/${itemValue}`);
      }}
      inputBehavior="autohighlight"
      positioning={{ sameWidth: true, gutter: 6 }}>
      <Combobox.Control className="buscador-animales__control">
        <Combobox.Input
          ref={inputRef}
          className="buscador-animales__input"
          placeholder="Buscar animales por caravana…"
          aria-label="Buscar animales por caravana"
        />
        <button
          type="button"
          className="buscador-animales__boton"
          aria-label="Buscar"
          tabIndex={-1}
          onClick={() => inputRef.current?.focus()}>
          <IconSearch size={18} stroke={2.25} />
        </button>
      </Combobox.Control>
      <Portal>
        <Combobox.Positioner>
          <Combobox.Content className="buscador-animales__menu">
            <Combobox.Empty className="buscador-animales__vacio">
              {buscando ? "Buscando…" : "No hay animales con esa caravana."}
            </Combobox.Empty>
            {resultados.length > 0 && (
              <div className="buscador-animales__titulo">Animales</div>
            )}
            {resultados.map((animal) => {
              const lote =
                animal.lote_id !== null ? nombreLote.get(animal.lote_id) : null;
              const hembra = animal.sexo === "HEMBRA";
              return (
                <Combobox.Item
                  key={animal.id}
                  item={animal}
                  className="buscador-animales__item">
                  <span
                    className="buscador-animales__avatar"
                    data-sexo={hembra ? "hembra" : "macho"}>
                    {hembra ? (
                      <IconGenderFemale size={16} stroke={2} />
                    ) : (
                      <IconGenderMale size={16} stroke={2} />
                    )}
                  </span>
                  <span className="buscador-animales__texto">
                    <span className="buscador-animales__caravana">
                      {caravanaDe(animal)}
                    </span>
                    <span className="buscador-animales__meta">
                      {CATEGORIA_ANIMAL_LABELS[animal.categoria] ?? animal.categoria}
                      {lote ? ` · ${lote}` : ""}
                    </span>
                  </span>
                  <IconCornerDownLeft
                    className="buscador-animales__enter"
                    size={16}
                    stroke={1.75}
                  />
                </Combobox.Item>
              );
            })}
            <div className="buscador-animales__pie" aria-hidden="true">
              <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
              <span><kbd>↵</kbd> abrir</span>
              <span><kbd>esc</kbd> cerrar</span>
            </div>
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  );
}
