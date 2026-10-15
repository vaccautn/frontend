import { useCallback, useEffect, useState } from "react";
import { getRecomendacionesSesion } from "../services/recomendacionesService";
import type { AptitudVaca } from "../types";
import { RecomendacionesPanel } from "./RecomendacionesPanel";

type Props = {
  sesionId: number;
  /** Cambia cuando se editan evaluaciones de la sesión, para recargar. */
  version?: unknown;
};

/** Recomendaciones de las vacas evaluadas en una sesión cerrada (S17). */
export function RecomendacionesSesion({ sesionId, version }: Props) {
  const [vacas, setVacas] = useState<AptitudVaca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(() => {
    setError("");
    getRecomendacionesSesion(sesionId)
      .then(setVacas)
      .catch(() => setError("No se pudieron cargar las recomendaciones."))
      .finally(() => setLoading(false));
  }, [sesionId]);

  useEffect(() => {
    const timer = window.setTimeout(cargar, 0);
    return () => window.clearTimeout(timer);
  }, [cargar, version]);

  return (
    <RecomendacionesPanel
      vacas={vacas}
      loading={loading}
      error={error}
      onDecidido={cargar}
    />
  );
}
