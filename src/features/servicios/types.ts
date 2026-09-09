import type { CategoriaAnimal } from "@/features/animales/types";

export type EstadoServicio =
  | "PLANIFICADO"
  | "EN_CURSO"
  | "FINALIZADO"
  | "CANCELADO";

export type ServicioRead = {
  id: number;
  usuario_id: number;
  nombre: string;
  fecha_inicio: string; // date, "YYYY-MM-DD"
  fecha_fin: string | null;
  estado: EstadoServicio;
  observaciones: string;
  creado_en: string;
  actualizado_en: string;
};

export type ServicioListParams = {
  estado?: EstadoServicio;
  fecha_inicio_desde?: string;
  fecha_inicio_hasta?: string;
};

export type ServicioCreatePayload = {
  nombre: string;
  fecha_inicio: string;
  fecha_fin?: string;
  observaciones: string;
};

export type ServicioUpdatePayload = {
  nombre?: string;
  fecha_inicio?: string;
  fecha_fin?: string | null;
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

export type ResultadoServicioRead = {
  id: number;
  servicio_id: number;
  animal_id: number;
  estado: EstadoResultadoServicio;
  fecha_diagnostico: string | null;
  cria_id: number | null;
  observaciones: string;
  creado_en: string;
  actualizado_en: string;
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

/** Un lote asociado a un servicio actualmente EN_CURSO, con el servicio al
 * que pertenece — usado para el listado "lotes en servicio" del dashboard. */
export type LoteEnServicio = {
  lote: ServicioLoteRead;
  servicio: ServicioRead;
  rol: "vientre" | "toro";
};
