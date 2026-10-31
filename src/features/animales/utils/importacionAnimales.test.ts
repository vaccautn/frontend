import { describe, expect, it } from "vitest";
import type {
  AnalisisImportacion,
  ConsultaImportacion,
  FilaAnalizada,
} from "@/features/animales/types/importacion";
import { OPCION } from "@/features/animales/types/importacion";
import { armarArchivoErrores, armarConfirmacion, consultasPendientes } from "./importacionAnimales";

function fila(numero: number, extra: Partial<FilaAnalizada> = {}): FilaAnalizada {
  return {
    numero,
    celdas: [`AB12300${numero.toString().padStart(2, "0")}`, "Vaca seca", "Norte", "Compra", "15/08/2020", "Angus"],
    valores: {
      caravana: `AB12300${numero.toString().padStart(2, "0")}`,
      categoria: "VACA_SECA",
      lote: "Norte",
      origen: "COMPRA",
      fecha_nacimiento: "2020-08-15",
      raza: "Angus",
    },
    sexo: "HEMBRA",
    estado: "LISTA",
    inferencias: [],
    errores: [],
    consultas: [],
    ...extra,
  };
}

function consulta(extra: Partial<ConsultaImportacion> & Pick<ConsultaImportacion, "clave" | "tipo" | "campo">) {
  return { valor: "", mensaje: "", opciones: [], filas: [], lote_id: null, animal_existente: null, ...extra };
}

function analisis(filas: FilaAnalizada[], consultas: ConsultaImportacion[] = []): AnalisisImportacion {
  return {
    hoja: null,
    hojas_revisadas: [],
    encabezados: ["caravana", "categoria", "lote", "origen", "fecha_nacimiento", "raza"],
    columnas: { caravana: 0, categoria: 1, lote: 2, origen: 3, fecha_nacimiento: 4, raza: 5 },
    columnas_faltantes: [],
    formato_fecha: "DD/MM/AAAA",
    filas,
    consultas,
    resumen: { total: filas.length, listas: 0, con_inferencias: 0, con_consultas: 0, con_errores: 0 },
  };
}

describe("armarConfirmacion", () => {
  it("manda las filas sin errores con sus valores normalizados y deja afuera las con errores", () => {
    const { payload, sinResolver } = armarConfirmacion(
      analisis([fila(2), fila(3, { estado: "ERROR", errores: [{ campo: "caravana", mensaje: "x" }] })]),
      {},
    );
    expect(payload.filas.map((f) => f.numero)).toEqual([2]);
    expect(payload.filas[0]).toMatchObject({ caravana: "AB1230002", categoria: "VACA_SECA", confirmaciones: [] });
    expect(sinResolver).toEqual([]);
  });

  it("aplica valores dudosos, campos vacíos y origen servicio", () => {
    const consultas = [
      consulta({ clave: "raza:rangus", tipo: "VALOR_DUDOSO", campo: "raza", filas: [2] }),
      consulta({ clave: "vacio:fecha_nacimiento", tipo: "CAMPO_VACIO", campo: "fecha_nacimiento", filas: [2, 3] }),
      consulta({ clave: "vacio:raza", tipo: "CAMPO_VACIO", campo: "raza", filas: [3] }),
      consulta({ clave: "origen_servicio", tipo: "ORIGEN_SERVICIO", campo: "origen", filas: [3] }),
    ];
    const { payload } = armarConfirmacion(
      analisis(
        [
          fila(2, { estado: "CONSULTA", consultas: ["raza:rangus", "vacio:fecha_nacimiento"] }),
          fila(3, { estado: "CONSULTA", consultas: ["vacio:fecha_nacimiento", "vacio:raza", "origen_servicio"] }),
        ],
        consultas,
      ),
      {
        "raza:rangus": { opcion: "Brangus" },
        "vacio:fecha_nacimiento": { opcion: OPCION.VACIO },
        "vacio:raza": { opcion: "Hereford" },
        origen_servicio: { opcion: OPCION.CONFIRMAR },
      },
    );
    expect(payload.filas[0]).toMatchObject({ raza: "Brangus", confirmaciones: ["FECHA_VACIA"] });
    expect(payload.filas[1]).toMatchObject({ raza: "Hereford", confirmaciones: ["FECHA_VACIA", "ORIGEN_SERVICIO"] });
  });

  it("las consultas sin decidir o con 'no importar' quedan sin resolver", () => {
    const consultas = [consulta({ clave: "vacio:raza", tipo: "CAMPO_VACIO", campo: "raza", filas: [2, 3] })];
    const filas = [2, 3].map((n) => fila(n, { estado: "CONSULTA", consultas: ["vacio:raza"] }));

    expect(armarConfirmacion(analisis(filas, consultas), {}).sinResolver).toEqual([2, 3]);
    expect(
      armarConfirmacion(analisis(filas, consultas), {
        "vacio:raza": { opcion: OPCION.VACIO, porFila: { 3: OPCION.NO_IMPORTAR } },
      }).sinResolver,
    ).toEqual([3]);
  });

  it("crea, usa o reactiva lotes según la decisión", () => {
    const consultas = [
      consulta({ clave: "lote:potrero5", tipo: "LOTE_NUEVO", campo: "lote", valor: "Potrero 5", filas: [2, 3] }),
      consulta({ clave: "lote_inactivo:9", tipo: "LOTE_INACTIVO", campo: "lote", valor: "Viejo", filas: [4], lote_id: 9 }),
    ];
    const { payload } = armarConfirmacion(
      analisis(
        [
          fila(2, { estado: "CONSULTA", consultas: ["lote:potrero5"] }),
          fila(3, { estado: "CONSULTA", consultas: ["lote:potrero5"] }),
          fila(4, { estado: "CONSULTA", consultas: ["lote_inactivo:9"] }),
        ],
        consultas,
      ),
      {
        "lote:potrero5": { opcion: OPCION.CREAR_LOTE, categoriaLote: "", porFila: { 3: "Norte" } },
        "lote_inactivo:9": { opcion: OPCION.REACTIVAR_LOTE },
      },
    );
    expect(payload.lotes_nuevos).toEqual([{ nombre: "Potrero 5", categoria: null }]);
    expect(payload.lotes_reactivar).toEqual([9]);
    expect(payload.filas[1].lote).toBe("Norte");
  });

  it("de una caravana repetida conserva solo la fila elegida", () => {
    const consultas = [consulta({ clave: "repetida:AB1230002", tipo: "CARAVANA_REPETIDA", campo: "caravana", filas: [2, 3] })];
    const resultado = armarConfirmacion(
      analisis([2, 3].map((n) => fila(n, { estado: "CONSULTA", consultas: ["repetida:AB1230002"] })), consultas),
      { "repetida:AB1230002": { opcion: `${OPCION.PREFIJO_FILA}3` } },
    );
    expect(resultado.payload.filas.map((f) => f.numero)).toEqual([3]);
    expect(resultado.descartadas).toEqual([2]);
  });

  it("marca la actualización de un animal existente", () => {
    const consultas = [consulta({ clave: "registrada:AB1230002", tipo: "CARAVANA_REGISTRADA", campo: "caravana", filas: [2] })];
    const resultado = armarConfirmacion(
      analisis([fila(2, { estado: "CONSULTA", consultas: ["registrada:AB1230002"] })], consultas),
      { "registrada:AB1230002": { opcion: OPCION.ACTUALIZAR } },
    );
    expect(resultado.payload.filas[0].confirmaciones).toEqual(["ACTUALIZAR"]);
    expect(resultado.actualizaciones).toBe(1);
  });
});

describe("reactivación", () => {
  it("marca la reactivación de un animal propio dado de baja", () => {
    const consultas = [consulta({ clave: "dada_de_baja:AB1230002", tipo: "CARAVANA_DADA_DE_BAJA", campo: "caravana", filas: [2] })];
    const resultado = armarConfirmacion(
      analisis([fila(2, { estado: "CONSULTA", consultas: ["dada_de_baja:AB1230002"] })], consultas),
      { "dada_de_baja:AB1230002": { opcion: OPCION.REACTIVAR_ANIMAL } },
    );
    expect(resultado.payload.filas[0].confirmaciones).toEqual(["REACTIVAR"]);
    expect(resultado.reactivaciones).toBe(1);
  });
});

describe("consultasPendientes", () => {
  it("una consulta queda pendiente mientras alguna fila no tenga opción", () => {
    const c = consulta({ clave: "vacio:raza", tipo: "CAMPO_VACIO", campo: "raza", filas: [2, 3] });
    expect(consultasPendientes([c], {})).toHaveLength(1);
    expect(consultasPendientes([c], { "vacio:raza": { porFila: { 2: OPCION.VACIO } } })).toHaveLength(1);
    expect(consultasPendientes([c], { "vacio:raza": { opcion: OPCION.VACIO } })).toHaveLength(0);
  });
});

describe("armarArchivoErrores", () => {
  it("junta las filas con errores del análisis y las rechazadas al confirmar", () => {
    const datos = analisis([
      fila(2),
      fila(3, { estado: "ERROR", errores: [{ campo: "categoria", mensaje: "Categoría desconocida" }] }),
      fila(4),
    ]);
    const payload = armarArchivoErrores(datos, {
      creados: 1,
      actualizados: 0,
      reactivados: 0,
      con_errores: 1,
      lotes_creados: [],
      lotes_reactivados: [],
      filas: [
        { numero: 2, estado: "CREADO", animal_id: 1, errores: [] },
        { numero: 4, estado: "ERROR", animal_id: null, errores: [{ campo: "raza", mensaje: "Falta la raza." }] },
      ],
    });
    expect(payload.filas.map((f) => [f.numero, f.errores[0].mensaje])).toEqual([
      [3, "Categoría desconocida"],
      [4, "Falta la raza."],
    ]);
    expect(payload.filas[0].celdas).toEqual(datos.filas[1].celdas);
  });
});
