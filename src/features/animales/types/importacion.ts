/** Tipos de la importación de animales. Reflejan app/schemas/importacion.py. */

import type { CategoriaAnimal, EstadoAnimal, OrigenAnimal, SexoAnimal } from "./animales";

export type CampoImportacion =
  | "caravana"
  | "categoria"
  | "lote"
  | "origen"
  | "fecha_nacimiento"
  | "raza";

export type EstadoFilaImportacion = "LISTA" | "INFERIDA" | "CONSULTA" | "ERROR";

export type TipoConsulta =
  | "VALOR_DUDOSO"
  | "CAMPO_VACIO"
  | "ORIGEN_SERVICIO"
  | "LOTE_NUEVO"
  | "LOTE_INACTIVO"
  | "CARAVANA_REPETIDA"
  | "CARAVANA_REGISTRADA"
  | "CARAVANA_DADA_DE_BAJA";

export type ConfirmacionImportacion =
  | "RAZA_VACIA"
  | "FECHA_VACIA"
  | "ORIGEN_VACIO"
  | "ORIGEN_SERVICIO"
  | "ACTUALIZAR"
  | "REACTIVAR";

export const OPCION = {
  NO_IMPORTAR: "__NO_IMPORTAR__",
  VACIO: "__VACIO__",
  CONFIRMAR: "__CONFIRMAR__",
  CREAR_LOTE: "__CREAR__",
  REACTIVAR_LOTE: "__REACTIVAR__",
  ACTUALIZAR: "__ACTUALIZAR__",
  REACTIVAR_ANIMAL: "__REACTIVAR_ANIMAL__",
  PREFIJO_FILA: "FILA:",
} as const;

export type ErrorCampo = { campo: CampoImportacion | null; mensaje: string };

export type InferenciaImportacion = {
  campo: CampoImportacion;
  original: string;
  valor: string;
};

export type OpcionConsulta = { valor: string; etiqueta: string };

export type AnimalExistente = {
  id: number;
  caravana: string;
  categoria: CategoriaAnimal;
  estado: EstadoAnimal;
  lote: string | null;
  raza: string;
  fecha_nacimiento: string | null;
  origen: OrigenAnimal;
};

export type ConsultaImportacion = {
  clave: string;
  tipo: TipoConsulta;
  campo: CampoImportacion;
  valor: string;
  mensaje: string;
  opciones: OpcionConsulta[];
  filas: number[];
  lote_id: number | null;
  animal_existente: AnimalExistente | null;
};

export type ValoresFila = {
  caravana: string;
  categoria: string;
  lote: string;
  origen: string;
  fecha_nacimiento: string | null;
  raza: string;
};

export type FilaAnalizada = {
  numero: number;
  celdas: string[];
  valores: ValoresFila;
  sexo: SexoAnimal | null;
  estado: EstadoFilaImportacion;
  inferencias: InferenciaImportacion[];
  errores: ErrorCampo[];
  consultas: string[];
};

export type AnalisisImportacion = {
  hoja: string | null;
  hojas_revisadas: string[];
  encabezados: string[];
  columnas: Partial<Record<CampoImportacion, number>>;
  columnas_faltantes: CampoImportacion[];
  formato_fecha: string;
  filas: FilaAnalizada[];
  consultas: ConsultaImportacion[];
  resumen: {
    total: number;
    listas: number;
    con_inferencias: number;
    con_consultas: number;
    con_errores: number;
  };
};

export type FilaConfirmar = ValoresFila & {
  numero: number;
  confirmaciones: ConfirmacionImportacion[];
};

export type ConfirmarImportacionPayload = {
  filas: FilaConfirmar[];
  lotes_nuevos: { nombre: string; categoria: CategoriaAnimal | null }[];
  lotes_reactivar: number[];
};

export type ResultadoFila = {
  numero: number;
  estado: "CREADO" | "ACTUALIZADO" | "REACTIVADO" | "ERROR";
  animal_id: number | null;
  errores: ErrorCampo[];
};

export type ResultadoImportacion = {
  creados: number;
  actualizados: number;
  reactivados: number;
  con_errores: number;
  lotes_creados: string[];
  lotes_reactivados: string[];
  filas: ResultadoFila[];
};

export type ArchivoErroresPayload = {
  encabezados: string[];
  columnas: Partial<Record<CampoImportacion, number>>;
  filas: { numero: number; celdas: string[]; errores: ErrorCampo[] }[];
};
