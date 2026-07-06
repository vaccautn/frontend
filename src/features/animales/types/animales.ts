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
  estado?: EstadoAnimal;
};
