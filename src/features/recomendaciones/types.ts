import type { Animal } from "@/features/animales/types";
import type { LoteOption } from "@/features/lotes/types";

export type TipoRecomendacion =
  | "DESTETE_PRECOZ"
  | "DESTETE_TEMPORARIO"
  | "TRATAMIENTO_HORMONAL";

export type EstadoRecomendacion = "PENDIENTE" | "ACEPTADA" | "RECHAZADA";

/** APTA = sin recomendaciones (primera iteración). SIN_CC solo por servicio. */
export type AptitudServicio = "APTA" | "CON_RECOMENDACION" | "SIN_CC";

export type RecomendacionRead = {
  id: number;
  tipo: TipoRecomendacion;
  estado: EstadoRecomendacion;
  /** Motivo, tomado de la regla que la generó. */
  descripcion: string;
  regla_codigo: string;
  valor_cc: number;
  evaluacion_cc_id: number;
  fecha_decision: string | null;
};

export type AptitudVaca = {
  animal: Animal;
  lote: LoteOption | null;
  evaluacion: {
    id: number;
    sesion_id: number;
    fecha: string;
    valor_cc: number;
  } | null;
  aptitud: AptitudServicio;
  recomendaciones: RecomendacionRead[];
};

export type RecomendacionesServicio = {
  servicio_id: number;
  fecha_referencia: string;
  dias: number;
  desde: string;
  vacas: AptitudVaca[];
};

export type DecisionPayload = {
  ids: number[];
  estado: Exclude<EstadoRecomendacion, "PENDIENTE">;
};
