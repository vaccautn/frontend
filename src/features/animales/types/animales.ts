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
