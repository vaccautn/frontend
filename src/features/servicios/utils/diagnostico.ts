import type {
  EstadoResultadoCargable,
  EstadoResultadoServicio,
  TipoPrenez,
} from "@/features/servicios/types";

export type Diagnostico = {
  estado: EstadoResultadoCargable;
  tipo: TipoPrenez | "";
};

export function esCargable(
  estado: EstadoResultadoServicio,
): estado is EstadoResultadoCargable {
  return estado === "PENDIENTE" || estado === "PRENADA" || estado === "VACIA";
}

export const faltaTipo = (diagnostico: Diagnostico | undefined) =>
  diagnostico?.estado === "PRENADA" && !diagnostico.tipo;
