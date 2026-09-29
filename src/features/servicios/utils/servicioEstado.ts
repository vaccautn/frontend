import type {
  ResultadoServicioRead,
  ServicioRead,
} from "@/features/servicios/types";

export type PendientesServicio = {
  /** Hay vacas con el diagnóstico sin cargar. */
  resultados: boolean;
  /** Hay vacas vacías y activas que todavía no están en ningún reservicio. */
  reservicio: boolean;
};

/** Qué le falta a cada servicio FINALIZADO. `servicios` tiene que incluir
 * los reservicios (sin filtrar) para saber qué vacas ya están en uno. */
export function pendientesPorServicio(
  servicios: ServicioRead[],
  resultados: ResultadoServicioRead[],
  animalActivoIds: Set<number>,
): Map<number, PendientesServicio> {
  const origenPorReservicio = new Map(
    servicios
      .filter((s) => s.servicio_origen_id !== null)
      .map((s) => [s.id, s.servicio_origen_id as number]),
  );
  // "origenId:animalId" de cada vaca que ya está en un reservicio.
  const enReservicio = new Set(
    resultados
      .filter((r) => origenPorReservicio.has(r.servicio_id))
      .map((r) => `${origenPorReservicio.get(r.servicio_id)}:${r.animal_id}`),
  );

  const pendientes = new Map<number, PendientesServicio>();
  for (const servicio of servicios) {
    if (servicio.estado !== "FINALIZADO") continue;
    const propios = resultados.filter((r) => r.servicio_id === servicio.id);
    pendientes.set(servicio.id, {
      resultados: propios.some((r) => r.estado === "PENDIENTE"),
      reservicio:
        servicio.servicio_origen_id === null &&
        propios.some(
          (r) =>
            r.estado === "VACIA" &&
            animalActivoIds.has(r.animal_id) &&
            !enReservicio.has(`${servicio.id}:${r.animal_id}`),
        ),
    });
  }
  return pendientes;
}
