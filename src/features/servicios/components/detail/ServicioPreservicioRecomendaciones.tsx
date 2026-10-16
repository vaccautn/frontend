import { useCallback, useEffect, useState } from "react";
import { getRecomendacionesServicio } from "@/features/recomendaciones/services/recomendacionesService";
import { RecomendacionesPanel } from "@/features/recomendaciones/components/RecomendacionesPanel";
import type { AptitudVaca } from "@/features/recomendaciones/types";

/** Ventana de CC que se mira para el preservicio, igual que el resto de la app. */
const DIAS = 30;

/** Tabla de recomendaciones de manejo pre-servicio (CC bajo -> destete/hormonal)
 * para las vacas del servicio, con aceptación inline. Reusa el mismo panel que
 * ya usa la vista de sesión — mismos datos, mismo flujo de aceptar/rechazar. */
export function ServicioPreservicioRecomendaciones({ servicioId }: { servicioId: number }) {
  const [vacas, setVacas] = useState<AptitudVaca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(() => {
    setError("");
    getRecomendacionesServicio(servicioId, DIAS)
      .then((datos) => setVacas(datos.vacas))
      .catch(() => setError("No se pudieron cargar las recomendaciones."))
      .finally(() => setLoading(false));
  }, [servicioId]);

  useEffect(() => {
    const timer = window.setTimeout(cargar, 0);
    return () => window.clearTimeout(timer);
  }, [cargar]);

  return <RecomendacionesPanel vacas={vacas} loading={loading} error={error} onDecidido={cargar} />;
}
