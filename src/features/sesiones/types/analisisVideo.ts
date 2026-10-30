export type ResultadoVideo = {
  sequence: number;
  posicion: number;
  animal_id: number | null;
  evaluacion_id: number | null;
  cc_estado: string;
  imagen_estado: string;
  evidencia_id: number | null;
  imagen_url: string | null;
  motivo: string | null;
};

export type AnalisisVideo = {
  id: string;
  sesion_id: number;
  estado: string;
  entradas_count: number;
  pasajes_count: number | null;
  unresolved_count: number;
  aplicados_count: number;
  discrepancia: boolean | null;
  animales_sin_pasaje: number[];
  pasajes_sin_asignar: number[];
  advertencias: string[];
  error_code: string | null;
  limpieza: string;
  error_limpieza: string | null;
  resultados: ResultadoVideo[];
};

export type AnalisisVideoList = { items: AnalisisVideo[] };
