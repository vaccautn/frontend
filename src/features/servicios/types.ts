import type { Animal, CategoriaAnimal } from "@/features/animales/types";

export type EstadoServicio =
  | "PLANIFICADO"
  | "EN_CURSO"
  | "FINALIZADO"
  | "CERRADO"
  | "CANCELADO";

export type ServicioRead = {
  id: number;
  usuario_id: number;
  nombre: string;
  fecha_inicio: string; // date, "YYYY-MM-DD"
  fecha_fin: string | null;
  estado: EstadoServicio;
  observaciones: string;
  /** Si es un reservicio: el servicio del que salieron sus vacas vacías. */
  servicio_origen_id: number | null;
  creado_en: string;
  actualizado_en: string;
};

export type ServicioListParams = {
  estado?: EstadoServicio;
  fecha_inicio_desde?: string;
  fecha_inicio_hasta?: string;
  servicio_origen_id?: number;
};

export type ReservicioCreatePayload = {
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  observaciones: string;
  lote: { nombre: string; categoria: CategoriaAnimal };
  animal_ids: number[];
  /** Lotes de toros del servicio original que se suman al reservicio. */
  toro_lote_ids: number[];
};

export type ServicioCreatePayload = {
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  observaciones: string;
};

export type ServicioUpdatePayload = {
  nombre?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado?: EstadoServicio;
  observaciones?: string;
};

export type ServicioLoteRead = {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: CategoriaAnimal;
  activo: boolean;
};

/** Lotes asociados a un servicio, agrupados por el rol que cumplen (inferido
 * de la categoría de cada lote): vientres (hembras) y toros (machos). */
export type ServicioLotesAgrupados = {
  vientres: ServicioLoteRead[];
  toros: ServicioLoteRead[];
};

export type ServicioLoteAsociacion = {
  id: number;
  servicio_id: number;
  lote_id: number;
  creado_en: string;
};

export type EstadoResultadoServicio =
  | "PENDIENTE"
  | "PRENADA"
  | "VACIA"
  | "ABORTO"
  | "PARIDA";

/** Momento del servicio en que quedó preñada: principio (1), mitad (2) o
 * final (3). Lo informa el veterinario en la ecografía. */
export type TipoPrenez = "CABEZA" | "CUERPO" | "COLA";

export type ResultadoServicioRead = {
  id: number;
  servicio_id: number;
  animal_id: number;
  /** Lote con el que la vaca participó del servicio (no cambia si se mueve). */
  lote_id: number | null;
  estado: EstadoResultadoServicio;
  tipo_prenez: TipoPrenez | null;
  fecha_diagnostico: string | null;
  cria_id: number | null;
  observaciones: string;
  creado_en: string;
  actualizado_en: string;
};

export type ResultadoServicioUpdatePayload = {
  estado?: EstadoResultadoServicio;
  fecha_diagnostico?: string;
  cria_id?: number;
  observaciones?: string;
};

/** Vaca que participa del servicio: su resultado, el animal, el lote con el
 * que participó y el lote en el que está hoy (pueden diferir). */
export type ParticipanteServicio = {
  resultado: ResultadoServicioRead;
  animal: Animal;
  lote_participacion: ServicioLoteRead | null;
  lote_actual: ServicioLoteRead | null;
  /** Reservicio vigente de este servicio en el que está la vaca. */
  reservicio_id: number | null;
};

/** Estados que se cargan desde la pantalla de resultados. */
export type EstadoResultadoCargable = Extract<
  EstadoResultadoServicio,
  "PENDIENTE" | "PRENADA" | "VACIA"
>;

export type CargaResultadosPayload = {
  fecha_diagnostico: string;
  resultados: {
    resultado_id: number;
    estado: EstadoResultadoCargable;
    tipo_prenez?: TipoPrenez;
  }[];
};

export type ResultadoServicioListParams = {
  servicioId?: number;
  animalId?: number;
  estado?: EstadoResultadoServicio;
};

export type ResultadoServicioCreatePayload = {
  servicio_id: number;
  animal_id: number;
  estado: EstadoResultadoServicio;
  fecha_diagnostico?: string;
  observaciones?: string;
};
