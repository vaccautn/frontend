import JSZip from "jszip";
import { CATEGORIAS_ANIMAL, CATEGORIAS_POR_SEXO } from "../constants";

/** Lectura y validación local de la planilla de importación de animales.
 * Todavía no se envía nada al backend: solo arma la vista previa. */

export type ClaveColumna =
  | "caravana"
  | "sexo"
  | "categoria"
  | "lote"
  | "fecha_nacimiento"
  | "raza";

export type ColumnaImportacion = {
  clave: ClaveColumna;
  titulo: string;
  formato: string;
  ejemplo: string;
  /** Encabezados aceptados, ya normalizados (minúsculas, sin tildes, _). */
  alias: string[];
};

// Mismos campos obligatorios que el alta manual de un animal.
export const COLUMNAS_IMPORTACION: ColumnaImportacion[] = [
  {
    clave: "caravana",
    titulo: "Identificador",
    formato: "Caravana o RFID, único por animal",
    ejemplo: "AR-00123",
    alias: ["caravana", "id", "identificador", "identificador_unico", "rfid"],
  },
  {
    clave: "sexo",
    titulo: "Sexo",
    formato: "HEMBRA o MACHO",
    ejemplo: "HEMBRA",
    alias: ["sexo"],
  },
  {
    clave: "categoria",
    titulo: "Categoría",
    formato: "Una de las categorías del rodeo",
    ejemplo: "VACA_SECA",
    alias: ["categoria"],
  },
  {
    clave: "lote",
    titulo: "Lote",
    formato: "Nombre de un lote existente",
    ejemplo: "Lote Norte",
    alias: ["lote", "nombre_lote"],
  },
  {
    clave: "fecha_nacimiento",
    titulo: "Fecha de nacimiento",
    formato: "DD/MM/AAAA o AAAA-MM-DD",
    ejemplo: "15/08/2023",
    alias: ["fecha_nacimiento", "fecha_de_nacimiento", "nacimiento"],
  },
  {
    clave: "raza",
    titulo: "Raza",
    formato: "Ej.: Angus, Hereford, Brangus",
    ejemplo: "Brangus",
    alias: ["raza"],
  },
];

export const EXTENSIONES_ACEPTADAS = [".csv", ".xlsx"];
export const TIPOS_ACEPTADOS = [
  "text/csv",
  ".csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xlsx",
];
export const TAMANO_MAX_PLANILLA = 5 * 1024 * 1024;

export type TablaImportada = { encabezados: string[]; filas: string[][] };

export function normalizarEncabezado(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

// ── Lectura ──────────────────────────────────────────────────────────────

export async function leerPlanilla(archivo: File): Promise<TablaImportada> {
  const nombre = archivo.name.toLowerCase();
  const filas = nombre.endsWith(".xlsx")
    ? await leerXlsx(archivo)
    : leerCsv(await archivo.text());
  const [encabezados = [], ...resto] = filas;
  return {
    encabezados,
    // Se descartan las filas completamente vacías (típicas al final).
    filas: resto.filter((fila) => fila.some((celda) => celda.trim() !== "")),
  };
}

/** CSV con comillas ("a, b" o "dijo ""hola"""). El separador se detecta en
 * la primera línea: Excel en español guarda con ";". */
export function leerCsv(texto: string): string[][] {
  const contenido = texto.replace(/^\uFEFF/, "");
  const primeraLinea = contenido.split(/\r?\n/, 1)[0] ?? "";
  const separador =
    (primeraLinea.match(/;/g)?.length ?? 0) > (primeraLinea.match(/,/g)?.length ?? 0)
      ? ";"
      : ",";

  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = "";
  let entreComillas = false;

  for (let i = 0; i < contenido.length; i++) {
    const c = contenido[i];
    if (entreComillas) {
      if (c === '"' && contenido[i + 1] === '"') {
        celda += '"';
        i++;
      } else if (c === '"') {
        entreComillas = false;
      } else {
        celda += c;
      }
    } else if (c === '"') {
      entreComillas = true;
    } else if (c === separador) {
      fila.push(celda.trim());
      celda = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && contenido[i + 1] === "\n") i++;
      fila.push(celda.trim());
      filas.push(fila);
      fila = [];
      celda = "";
    } else {
      celda += c;
    }
  }
  if (celda !== "" || fila.length > 0) {
    fila.push(celda.trim());
    filas.push(fila);
  }
  return filas;
}

/** Primera hoja de un .xlsx (es un zip de XML). Sin dependencias nuevas:
 * usa jszip, que ya está instalado para los KMZ del mapa. */
async function leerXlsx(archivo: File): Promise<string[][]> {
  const zip = await JSZip.loadAsync(archivo);
  const parser = new DOMParser();
  const leerXml = async (ruta: string) => {
    const texto = await zip.file(ruta)?.async("string");
    return texto ? parser.parseFromString(texto, "application/xml") : null;
  };

  const compartidos = await leerXml("xl/sharedStrings.xml");
  const textos = compartidos
    ? Array.from(compartidos.getElementsByTagName("si")).map((si) =>
        Array.from(si.getElementsByTagName("t"))
          .map((t) => t.textContent ?? "")
          .join(""),
      )
    : [];

  // ponytail: solo la primera hoja (sheet1); si hiciera falta elegir hoja,
  // leer xl/workbook.xml y sus relaciones.
  const hoja = await leerXml("xl/worksheets/sheet1.xml");
  if (!hoja) throw new Error("El archivo no tiene hojas.");

  return Array.from(hoja.getElementsByTagName("row")).map((row) => {
    const fila: string[] = [];
    for (const c of Array.from(row.getElementsByTagName("c"))) {
      const columna = indiceColumna(c.getAttribute("r") ?? "");
      const tipo = c.getAttribute("t");
      const valor = c.getElementsByTagName("v")[0]?.textContent ?? "";
      fila[columna] =
        tipo === "s"
          ? (textos[Number(valor)] ?? "")
          : tipo === "inlineStr"
            ? (c.getElementsByTagName("t")[0]?.textContent ?? "")
            : valor;
    }
    return Array.from(fila, (celda) => (celda ?? "").trim());
  });
}

/** "C12" → 2 (columna C, base 0). */
function indiceColumna(referencia: string): number {
  const letras = referencia.replace(/\d+/g, "");
  let indice = 0;
  for (const letra of letras) indice = indice * 26 + (letra.charCodeAt(0) - 64);
  return indice - 1;
}

// ── Columnas y validación ────────────────────────────────────────────────

/** Posición de cada columna esperada en el archivo (-1 si no está). */
export function ubicarColumnas(
  encabezados: string[],
): Record<ClaveColumna, number> {
  const normalizados = encabezados.map(normalizarEncabezado);
  return Object.fromEntries(
    COLUMNAS_IMPORTACION.map(({ clave, alias }) => [
      clave,
      normalizados.findIndex((h) => alias.includes(h)),
    ]),
  ) as Record<ClaveColumna, number>;
}

const CATEGORIAS = new Set<string>(CATEGORIAS_ANIMAL.map((c) => c.value));
const CATEGORIA_POR_NOMBRE = new Map<string, string>(
  CATEGORIAS_ANIMAL.flatMap((c) => [
    [normalizarEncabezado(c.value), c.value],
    [normalizarEncabezado(c.label), c.value],
  ]),
);

/** "15/08/2023", "2023-08-15" o un número de fecha de Excel → "2023-08-15". */
export function normalizarFecha(valor: string): string | null {
  const v = valor.trim();
  let m = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return armarFecha(Number(m[3]), Number(m[2]), Number(m[1]));
  m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return armarFecha(Number(m[1]), Number(m[2]), Number(m[3]));
  if (/^\d{4,5}(\.\d+)?$/.test(v)) {
    // Excel guarda las fechas como días desde el 30/12/1899.
    const fecha = new Date(Date.UTC(1899, 11, 30) + Number(v) * 86400000);
    return armarFecha(
      fecha.getUTCFullYear(),
      fecha.getUTCMonth() + 1,
      fecha.getUTCDate(),
    );
  }
  return null;
}

function armarFecha(anio: number, mes: number, dia: number): string | null {
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) return null;
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export type FilaRevisada = {
  numero: number; // fila en el archivo (1 = encabezados)
  valores: Record<ClaveColumna, string>;
  errores: string[];
};

export function revisarFilas(
  tabla: TablaImportada,
  lotesExistentes: string[],
): FilaRevisada[] {
  const posiciones = ubicarColumnas(tabla.encabezados);
  const lotes = new Set(lotesExistentes.map(normalizarEncabezado));
  const vistas = new Map<string, number>();

  return tabla.filas.map((fila, i) => {
    const valores = Object.fromEntries(
      COLUMNAS_IMPORTACION.map(({ clave }) => [
        clave,
        posiciones[clave] >= 0 ? (fila[posiciones[clave]] ?? "").trim() : "",
      ]),
    ) as Record<ClaveColumna, string>;
    const errores: string[] = [];

    for (const { clave, titulo } of COLUMNAS_IMPORTACION) {
      if (posiciones[clave] >= 0 && !valores[clave]) errores.push(`Falta ${titulo.toLowerCase()}`);
    }

    const caravana = valores.caravana.toLowerCase();
    if (caravana) {
      if (vistas.has(caravana)) {
        errores.push(`Identificador repetido (fila ${vistas.get(caravana)})`);
      } else {
        vistas.set(caravana, i + 2);
      }
    }

    const sexo = valores.sexo.toUpperCase();
    if (valores.sexo && sexo !== "HEMBRA" && sexo !== "MACHO") {
      errores.push("Sexo inválido");
    } else if (valores.sexo) {
      valores.sexo = sexo;
    }

    if (valores.categoria) {
      const categoria =
        CATEGORIA_POR_NOMBRE.get(normalizarEncabezado(valores.categoria)) ??
        valores.categoria.toUpperCase();
      if (!CATEGORIAS.has(categoria)) {
        errores.push("Categoría desconocida");
      } else {
        valores.categoria = categoria;
        if (
          (sexo === "HEMBRA" || sexo === "MACHO") &&
          !CATEGORIAS_POR_SEXO[sexo].includes(categoria)
        ) {
          errores.push("La categoría no corresponde al sexo");
        }
      }
    }

    if (valores.fecha_nacimiento) {
      const fecha = normalizarFecha(valores.fecha_nacimiento);
      if (!fecha) errores.push("Fecha inválida");
      else valores.fecha_nacimiento = fecha;
    }

    if (valores.lote && lotes.size > 0 && !lotes.has(normalizarEncabezado(valores.lote))) {
      errores.push("El lote no existe");
    }

    return { numero: i + 2, valores, errores };
  });
}

// ── Plantilla ────────────────────────────────────────────────────────────

/** Plantilla con ";" (lo que espera Excel en español) y BOM para que abra
 * los acentos bien. */
export function descargarPlantilla() {
  const filas = [
    COLUMNAS_IMPORTACION.map((c) => c.clave),
    ["AR-00123", "HEMBRA", "VACA_SECA", "Lote Norte", "15/08/2023", "Brangus"],
    ["AR-00124", "MACHO", "TORO", "Toros", "02/03/2021", "Angus"],
  ];
  const csv = "\uFEFF" + filas.map((f) => f.join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "plantilla-animales.csv";
  enlace.click();
  URL.revokeObjectURL(url);
}
