/** Importación de animales desde planilla: formato esperado, plantilla y cómo
 * se aplican las decisiones del productor antes de confirmar.
 *
 * La lectura del archivo y todas las reglas viven en el backend
 * (app/services/importacion): acá solo se arma lo que se le manda. */

import type { CategoriaAnimal } from "@/features/animales/types";
import {
  OPCION,
  type AnalisisImportacion,
  type ArchivoErroresPayload,
  type CampoImportacion,
  type ConfirmacionImportacion,
  type ConfirmarImportacionPayload,
  type ConsultaImportacion,
  type FilaConfirmar,
  type ResultadoImportacion,
} from "@/features/animales/types/importacion";

export type ColumnaImportacion = {
  clave: CampoImportacion;
  titulo: string;
  formato: string;
  ejemplo: string;
  obligatoria: boolean;
};

export const COLUMNAS_IMPORTACION: ColumnaImportacion[] = [
  {
    clave: "caravana",
    titulo: "Caravana",
    formato: "CUIG + número o los 15 dígitos de la electrónica",
    ejemplo: "AB123 0001",
    obligatoria: true,
  },
  {
    clave: "categoria",
    titulo: "Categoría",
    formato: "Una de las categorías del rodeo",
    ejemplo: "Vaca seca",
    obligatoria: true,
  },
  {
    clave: "lote",
    titulo: "Lote",
    formato: "Uno de tus lotes o uno nuevo",
    ejemplo: "Lote Norte",
    obligatoria: true,
  },
  {
    clave: "origen",
    titulo: "Origen",
    formato: "Compra o Servicio (nacido en el campo)",
    ejemplo: "Compra",
    obligatoria: false,
  },
  {
    clave: "fecha_nacimiento",
    titulo: "Fecha de nacimiento",
    formato: "DD/MM/AAAA",
    ejemplo: "15/08/2023",
    obligatoria: false,
  },
  {
    clave: "raza",
    titulo: "Raza",
    formato: "Una de las razas del sistema",
    ejemplo: "Brangus",
    obligatoria: false,
  },
];

export const TITULO_CAMPO = Object.fromEntries(
  COLUMNAS_IMPORTACION.map((c) => [c.clave, c.titulo]),
) as Record<CampoImportacion, string>;

export const TIPOS_ACEPTADOS = [
  "text/csv",
  ".csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xlsx",
];
export const TAMANO_MAX_PLANILLA = 5 * 1024 * 1024;

/** Plantilla con ";" (lo que espera Excel en español) y BOM para que abra
 * bien los acentos. */
export function descargarPlantilla() {
  const filas = [
    COLUMNAS_IMPORTACION.map((c) => c.clave),
    ["AB123 0001", "Vaca seca", "Lote Norte", "Compra", "15/08/2019", "Brangus"],
    ["032000123456789", "Ternero", "Recría", "Servicio", "02/09/2026", "Angus"],
  ];
  const csv = "﻿" + filas.map((f) => f.join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "plantilla-animales.csv";
  enlace.click();
  URL.revokeObjectURL(url);
}

// ── Decisiones ───────────────────────────────────────────────────────────────

export type Decision = {
  /** Opción elegida para todas las filas de la consulta. */
  opcion?: string;
  /** Excepciones: la opción para una fila puntual. */
  porFila?: Record<number, string>;
  /** Solo al crear un lote: su categoría ("" = no la sé, usar la más frecuente). */
  categoriaLote?: string;
};

export type Decisiones = Record<string, Decision>;

/** Las consultas que se pueden decidir fila por fila. Elegir qué fila
 * conservar de una caravana repetida es una decisión del grupo. */
export function admiteDecisionPorFila(consulta: ConsultaImportacion): boolean {
  return consulta.tipo !== "CARAVANA_REPETIDA" && consulta.filas.length > 1;
}

export function opcionDeFila(
  decision: Decision | undefined,
  numero: number,
): string | undefined {
  return decision?.porFila?.[numero] ?? decision?.opcion;
}

export function consultasPendientes(
  consultas: ConsultaImportacion[],
  decisiones: Decisiones,
): ConsultaImportacion[] {
  return consultas.filter((consulta) => {
    const decision = decisiones[consulta.clave];
    return consulta.filas.some((numero) => !opcionDeFila(decision, numero));
  });
}

const CONFIRMACION_CAMPO_VACIO: Partial<Record<CampoImportacion, ConfirmacionImportacion>> = {
  raza: "RAZA_VACIA",
  fecha_nacimiento: "FECHA_VACIA",
  origen: "ORIGEN_VACIO",
};

export type Confirmacion = {
  payload: ConfirmarImportacionPayload;
  /** Filas repetidas que el productor eligió no conservar: no se importan ni van al archivo de errores. */
  descartadas: number[];
  /** Filas con alguna consulta sin decidir o con "no importar": el backend las va a rechazar. */
  sinResolver: number[];
  actualizaciones: number;
  reactivaciones: number;
};

/** Aplica las decisiones a las filas sin errores y arma lo que se manda a
 * confirmar. Lo que quede sin resolver se manda igual: el backend lo rechaza
 * con su motivo y la fila termina en el archivo de errores. */
export function armarConfirmacion(
  analisis: AnalisisImportacion,
  decisiones: Decisiones,
): Confirmacion {
  const consultas = new Map(analisis.consultas.map((c) => [c.clave, c]));
  const lotesNuevos = new Map<string, { nombre: string; categoria: CategoriaAnimal | null }>();
  const lotesReactivar = new Set<number>();
  const filas: FilaConfirmar[] = [];
  const descartadas: number[] = [];
  const sinResolver: number[] = [];
  let actualizaciones = 0;
  let reactivaciones = 0;

  for (const fila of analisis.filas) {
    if (fila.estado === "ERROR") continue;
    const enviada: FilaConfirmar = { numero: fila.numero, ...fila.valores, confirmaciones: [] };
    let descartar = false;
    let resuelta = true;

    for (const clave of fila.consultas) {
      const consulta = consultas.get(clave);
      if (!consulta) continue;
      const decision = decisiones[clave];
      const opcion = opcionDeFila(decision, fila.numero);
      if (!opcion || opcion === OPCION.NO_IMPORTAR) {
        resuelta = false;
        continue;
      }

      switch (consulta.tipo) {
        case "VALOR_DUDOSO":
          enviada[consulta.campo] = opcion;
          break;
        case "CAMPO_VACIO": {
          const confirmacion = CONFIRMACION_CAMPO_VACIO[consulta.campo];
          if (opcion === OPCION.VACIO && confirmacion) {
            enviada.confirmaciones.push(confirmacion);
          } else {
            enviada[consulta.campo] = opcion;
          }
          break;
        }
        case "ORIGEN_SERVICIO":
          if (opcion === OPCION.CONFIRMAR) enviada.confirmaciones.push("ORIGEN_SERVICIO");
          else enviada.origen = opcion;
          break;
        case "LOTE_NUEVO":
          if (opcion === OPCION.CREAR_LOTE) {
            lotesNuevos.set(clave, {
              nombre: consulta.valor,
              categoria: (decision?.categoriaLote || null) as CategoriaAnimal | null,
            });
          } else {
            enviada.lote = opcion;
          }
          break;
        case "LOTE_INACTIVO":
          if (opcion === OPCION.REACTIVAR_LOTE && consulta.lote_id !== null) {
            lotesReactivar.add(consulta.lote_id);
          } else {
            enviada.lote = opcion;
          }
          break;
        case "CARAVANA_REPETIDA":
          descartar = opcion !== `${OPCION.PREFIJO_FILA}${fila.numero}`;
          break;
        case "CARAVANA_REGISTRADA":
          enviada.confirmaciones.push("ACTUALIZAR");
          actualizaciones++;
          break;
        case "CARAVANA_DADA_DE_BAJA":
          enviada.confirmaciones.push("REACTIVAR");
          reactivaciones++;
          break;
      }
    }

    if (descartar) {
      descartadas.push(fila.numero);
      if (enviada.confirmaciones.includes("ACTUALIZAR")) actualizaciones--;
      if (enviada.confirmaciones.includes("REACTIVAR")) reactivaciones--;
      continue;
    }
    if (!resuelta) sinResolver.push(fila.numero);
    filas.push(enviada);
  }

  return {
    payload: {
      filas,
      lotes_nuevos: [...lotesNuevos.values()],
      lotes_reactivar: [...lotesReactivar],
    },
    descartadas,
    sinResolver,
    actualizaciones,
    reactivaciones,
  };
}

/** Filas para el Excel de errores: las que ya tenían errores en el análisis
 * y las que el backend rechazó al confirmar, con sus celdas originales. */
export function armarArchivoErrores(
  analisis: AnalisisImportacion,
  resultado: ResultadoImportacion,
): ArchivoErroresPayload {
  const rechazadas = new Map(
    resultado.filas.filter((f) => f.estado === "ERROR").map((f) => [f.numero, f.errores]),
  );
  return {
    encabezados: analisis.encabezados,
    columnas: analisis.columnas,
    filas: analisis.filas
      .filter((fila) => fila.estado === "ERROR" || rechazadas.has(fila.numero))
      .map((fila) => ({
        numero: fila.numero,
        celdas: fila.celdas,
        errores: fila.estado === "ERROR" ? fila.errores : rechazadas.get(fila.numero) ?? [],
      })),
  };
}
