import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type {
  AnimalListParams,
  CategoriaAnimal,
  EstadoFiltro,
} from "@/features/animales/types";

const DEBOUNCE_MS = 300;

export function useAnimalesFiltros() {
  const [searchParams] = useSearchParams();
  const initialLoteParam = searchParams.get("lote_id");
  const initialLoteId = initialLoteParam ? Number(initialLoteParam) : null;

  const [caravanaInput, setCaravanaInput] = useState("");
  const [debouncedCaravana, setDebouncedCaravana] = useState("");
  const [raza, setRaza] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoFiltro | null>("ACTIVO");
  const [loteId, setLoteId] = useState<number | null>(initialLoteId);
  const [categoriaLote, setCategoriaLote] = useState<CategoriaAnimal | null>(
    null,
  );

  // Al cambiar la categoría, el lote elegido puede haber quedado fuera de
  // esa categoría: se limpia para no dejar un filtro de lote inconsistente.
  const handleCategoriaLoteChange = (value: CategoriaAnimal | null) => {
    setCategoriaLote(value);
    setLoteId(null);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCaravana(caravanaInput);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [caravanaInput]);

  const params = useMemo<AnimalListParams>(() => {
    const trimmedCaravana = debouncedCaravana.trim();
    return {
      ...(estado ? { estado } : {}),
      ...(raza ? { raza } : {}),
      ...(trimmedCaravana ? { caravana: trimmedCaravana } : {}),
      ...(loteId !== null ? { lote_id: loteId } : {}),
    };
  }, [estado, raza, debouncedCaravana, loteId]);

  return {
    caravanaInput,
    raza,
    estado,
    loteId,
    categoriaLote,
    setCaravanaInput,
    setRaza,
    setEstado,
    setLoteId,
    setCategoriaLote: handleCategoriaLoteChange,
    params,
  };
}
