export type EstadoAnimal =
  | "ACTIVO"
  | "INACTIVO"
  | "VENDIDO"
  | "MUERTO"
  | "DESCARTADO";

export type BajaAnimalMotivo = Extract<
  EstadoAnimal,
  "VENDIDO" | "MUERTO" | "DESCARTADO"
>;

export type SexoAnimal = "MACHO" | "HEMBRA" | "NO_INFORMADO";

export type EstadoFiltro = Extract<
  EstadoAnimal,
  "ACTIVO" | "VENDIDO" | "MUERTO"
>;

export type Animal = {
  id: number;
  caravana: string | null;
  sexo: string;
  raza: string;
  fecha_nacimiento: string | null;
  estado: EstadoAnimal;
  observacion: string;
  lote_id: number | null;
  creado_en: string;
  actualizado_en: string;
};

export type AnimalLoteGroup = {
  lote: {
    id: number;
    nombre: string;
    descripcion: string;
    usuario_administrador_id: number;
    activo: boolean;
    creado_en: string;
    actualizado_en: string;
  } | null;
  animales: Animal[];
};

export type RegisterAnimalPayload = {
  caravana: string;
  raza: string;
  sexo: string;
  fecha_nacimiento: string;
  lote_id: number | null;
};

export type UpdateAnimalPayload = {
  caravana?: string;
  raza?: string;
  sexo?: string;
  fecha_nacimiento?: string;
  estado?: EstadoAnimal;
  observacion?: string;
  lote_id?: number | null;
};

export type AnimalListParams = {
  estado?: EstadoFiltro;
  sexo?: SexoAnimal;
  raza?: string;
  caravana?: string;
  lote_id?: number;
};

export type EvaluacionCCEstado = "BORRADOR" | "CONFIRMADA" | "ANULADA";

export type EvaluacionCC = {
  id: number;
  animal_id: number;
  usuario_id: number;
  fecha: string;
  valor_cc: number;
  escala_min: number;
  escala_max: number;
  observaciones: string;
  estado: EvaluacionCCEstado;
  creado_en: string;
  actualizado_en: string;
};

export type RegisterEvaluacionCCPayload = {
  sesion_id: number;
  animal_id: number;
  valor_cc: number;
  escala_min: number;
  escala_max: number;
  observaciones?: string;
};

export type UpdateEvaluacionCCPayload = {
  valor_cc: number;
};

export type EvidenciaImagenRead = {
  id: number;
  evaluacion_id: number;
  storage_key: string;
  tipo: string;
  origen: string;
  estado: string;
  metadatos_json: Record<string, unknown>;
  url: string;
};

// ── Dashboard de animales (rodeo) ─────────────────────────────────────────────

export type HistogramaBin = {
  valor_cc: number; // always 1 | 2 | 3 | 4 | 5 — all five bins are always present
  cantidad: number;
};

export type EvolucionPunto = {
  periodo: string; // "YYYY-MM" — monthly bucket, chronological ascending
  promedio: number; // average CC of all confirmed evaluations that month
  cantidad_evaluaciones: number;
};

export type AlertaAnimal = {
  animal_id: number;
  caravana: string | null;
  valor_cc: number; // always 1 or 5 (critical extremes)
  fecha: string; // ISO 8601 datetime string
};

export type DashboardAnimalesData = {
  total_animales_activos: number;
  total_animales_evaluados: number; // active animals with ≥1 CONFIRMADA evaluation
  promedio_actual: number | null; // null when no evaluations exist at all
  histograma: HistogramaBin[]; // always length 5 (CC 1–5)
  evolucion: EvolucionPunto[]; // empty array if no history
  alertas: AlertaAnimal[]; // animals whose last confirmed CC = 1 or 5; sorted recent-first
};

// ── Dashboard de animal individual ───────────────────────────────────────────

export type EvaluacionPunto = {
  evaluacion_id: number;
  fecha: string; // ISO 8601 datetime, e.g. "2024-03-15T10:30:00"
  valor_cc: number; // 1 | 2 | 3 | 4 | 5
};

export type DashboardAnimalData = {
  animal_id: number;
  cantidad_evaluaciones: number;
  histograma: HistogramaBin[]; // always 5 bins (CC 1–5), same shape as rodeo dashboard
  evolucion: EvaluacionPunto[]; // one point per evaluation, chronological ascending
  historial_peores: EvaluacionPunto[]; // CC 1 or 5 only, most recent first
};
