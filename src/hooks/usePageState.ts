import { useEffect, useState, type SetStateAction } from "react";
import { getStoredUser } from "@/features/auth/store/authSession";

/** Estado de interfaz aislado por usuario y limitado a la pestaña actual. */
export function usePageState<T>(key: string, initial: T) {
  const storageKey = `vacca.ui.${getStoredUser()?.id ?? "public"}.${sessionStorage.getItem("vacca.campoActivo") ?? "todos"}.${key}`;
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      return stored === null ? initial : (JSON.parse(stored) as T);
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      /* La interfaz funciona también sin almacenamiento. */
    }
  }, [storageKey, value]);
  return [value, setValue] as [T, (value: SetStateAction<T>) => void];
}
