import { useEffect, useState, type SetStateAction } from "react";
import { getStoredUser } from "@/features/auth/store/authSession";

/** Estado de interfaz aislado por usuario y limitado a la pestaña actual. */
export function usePageState<T>(key: string, initial: T) {
  const storageKey = `vacca.ui.${getStoredUser()?.id ?? "public"}.${sessionStorage.getItem("vacca.campoActivo") ?? "todos"}.${key}`;
  function readValue(): T {
    try {
      const stored = sessionStorage.getItem(storageKey);
      return stored === null ? initial : (JSON.parse(stored) as T);
    } catch {
      return initial;
    }
  }
  const [state, setState] = useState(() => ({ key: storageKey, value: readValue() }));
  // Restablecer antes de renderizar los hijos evita mostrar o persistir datos
  // del campo anterior bajo la nueva clave.
  let current = state;
  if (state.key !== storageKey) {
    current = { key: storageKey, value: readValue() };
    setState(current);
  }
  useEffect(() => {
    if (state.key !== storageKey) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state.value));
    } catch {
      /* La interfaz funciona también sin almacenamiento. */
    }
  }, [storageKey, state]);
  function setValue(update: SetStateAction<T>) {
    setState((previous) => {
      const value = previous.key === storageKey ? previous.value : readValue();
      return {
        key: storageKey,
        value: typeof update === "function"
          ? (update as (value: T) => T)(value)
          : update,
      };
    });
  }
  return [current.value, setValue] as const;
}
