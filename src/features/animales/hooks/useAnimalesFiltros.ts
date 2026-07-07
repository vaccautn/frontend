import { useEffect, useMemo, useState } from "react";
import type {
  AnimalListParams,
  EstadoFiltro,
} from "@/features/animales/types";

const DEBOUNCE_MS = 300;

export function useAnimalesFiltros() {
  const [caravanaInput, setCaravanaInput] = useState("");
  const [debouncedCaravana, setDebouncedCaravana] = useState("");
  const [sexo, setSexo] = useState<"MACHO" | "HEMBRA" | null>(null);
  const [raza, setRaza] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoFiltro | null>("ACTIVO");

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
      ...(sexo ? { sexo } : {}),
      ...(raza ? { raza } : {}),
      ...(trimmedCaravana ? { caravana: trimmedCaravana } : {}),
    };
  }, [estado, sexo, raza, debouncedCaravana]);

  return {
    caravanaInput,
    sexo,
    raza,
    estado,
    setCaravanaInput,
    setSexo,
    setRaza,
    setEstado,
    params,
  };
}
