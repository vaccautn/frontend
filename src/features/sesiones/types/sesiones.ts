export type EstadoSesion = "ABIERTA" | "CERRADA" | "CANCELADA";

export type SesionCaptura = {
  id: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: EstadoSesion;
  observaciones: string;
  creado_en: string;
  actualizado_en: string;
  evaluaciones_count: number;
  valor_cc_mediana: number | null;
  valor_cc_min: number | null;
  valor_cc_max: number | null;
  distribucion: Record<string, number>;
};

export interface SesionListParams {
  estado?: string;
  fecha_inicio_desde?: string;
  fecha_inicio_hasta?: string;
  limit?: number;
  offset?: number;
}

export interface PaginatedSesionesResumenResponse {
  items: SesionCaptura[];
  has_more: boolean;
  next_offset: number | null;
}
