import type { ResultadoServicioRead, ServicioRead } from "../types";

export type HistorialPunto = {
  resultado: ResultadoServicioRead;
  servicio: ServicioRead;
};

export type Tendencia = "MEJORANDO" | "BAJANDO" | "ESTABLE" | "SIEMPRE_CABEZA";

const TENDENCIA_LABELS: Record<Tendencia, string> = {
  MEJORANDO: "Mejorando",
  BAJANDO: "Bajando",
  ESTABLE: "Estable",
  SIEMPRE_CABEZA: "Siempre cabeza",
};

export function labelTendencia(tendencia: Tendencia): string {
  return TENDENCIA_LABELS[tendencia];
}

/**
 * Agrupa resultados de servicio por animal y los ordena del más reciente al
 * más viejo según la fecha de inicio del servicio al que pertenecen,
 * recortando a `limite`. Una sola llamada sin filtros a
 * `getResultadosServicio()` trae todos los resultados del usuario (volumen
 * bajo, sin paginación en el backend) — esta función solo agrupa en cliente,
 * no hace fetch.
 */
export function construirHistorialPorAnimal(
  resultados: ResultadoServicioRead[],
  servicios: ServicioRead[],
  limite = 4,
): Map<number, HistorialPunto[]> {
  const servicioPorId = new Map(servicios.map((s) => [s.id, s]));
  const porAnimal = new Map<number, HistorialPunto[]>();

  for (const resultado of resultados) {
    const servicio = servicioPorId.get(resultado.servicio_id);
    if (!servicio) continue;
    const lista = porAnimal.get(resultado.animal_id) ?? [];
    lista.push({ resultado, servicio });
    porAnimal.set(resultado.animal_id, lista);
  }

  for (const [animalId, lista] of porAnimal) {
    lista.sort((a, b) => b.servicio.fecha_inicio.localeCompare(a.servicio.fecha_inicio));
    porAnimal.set(animalId, lista.slice(0, limite));
  }

  return porAnimal;
}

// Puntaje para comparar qué tan "temprano" quedó preñada: Cabeza es lo
// mejor, Vacía (o cualquier otro resultado) lo peor.
const PUNTAJE: Record<string, number> = { CABEZA: 3, CUERPO: 2, COLA: 1 };

function puntaje(punto: HistorialPunto): number {
  if (punto.resultado.estado !== "PRENADA" || !punto.resultado.tipo_prenez) return 0;
  return PUNTAJE[punto.resultado.tipo_prenez] ?? 0;
}

/**
 * Tendencia del resultado diagnosticado más reciente contra el promedio de
 * los anteriores (también diagnosticados). Un servicio donde la vaca todavía
 * está PENDIENTE no cuenta para la comparación: no "bajó", todavía no se
 * sabe. Devuelve null si no hay al menos 2 puntos diagnosticados.
 */
export function calcularTendencia(historial: HistorialPunto[]): Tendencia | null {
  const diagnosticados = historial.filter((p) => p.resultado.estado !== "PENDIENTE");
  if (diagnosticados.length < 2) return null;
  const [actual, ...anteriores] = diagnosticados;
  if (anteriores.every((p) => puntaje(p) === 3) && puntaje(actual) === 3) return "SIEMPRE_CABEZA";

  const promedioAnterior = anteriores.reduce((suma, p) => suma + puntaje(p), 0) / anteriores.length;
  const actualPuntaje = puntaje(actual);
  if (actualPuntaje > promedioAnterior + 0.4) return "MEJORANDO";
  if (actualPuntaje < promedioAnterior - 0.4) return "BAJANDO";
  return "ESTABLE";
}
