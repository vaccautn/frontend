import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, FileUpload } from "@chakra-ui/react";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCalendarEvent,
  IconCategory,
  IconCircleCheck,
  IconCircleX,
  IconCloudUpload,
  IconDna,
  IconDownload,
  IconFileSpreadsheet,
  IconGenderBigender,
  IconStack2,
  IconTag,
  IconX,
} from "@tabler/icons-react";
import { getLotes } from "@/features/lotes/services/lotesService";
import {
  CATEGORIAS_ANIMAL,
  CATEGORIAS_POR_SEXO,
} from "@/features/animales/constants";
import {
  COLUMNAS_IMPORTACION,
  TAMANO_MAX_PLANILLA,
  TIPOS_ACEPTADOS,
  descargarPlantilla,
  leerPlanilla,
  revisarFilas,
  ubicarColumnas,
  type ClaveColumna,
  type TablaImportada,
} from "@/features/animales/utils/importacionAnimales";
import "@/features/animales/components/animales.css";
import "@/features/animales/components/importar-animales.css";

const PASOS = ["Prepará la planilla", "Subí el archivo", "Revisá e importá"];

// Cada columna con su ícono; el color sale de data-columna en el CSS.
const ICONOS_COLUMNA: Record<ClaveColumna, typeof IconTag> = {
  caravana: IconTag,
  sexo: IconGenderBigender,
  categoria: IconCategory,
  lote: IconStack2,
  fecha_nacimiento: IconCalendarEvent,
  raza: IconDna,
};

function formatTamano(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Propuesta de interfaz para importar animales desde CSV o Excel. Lee y
 * valida el archivo en el navegador; todavía no envía nada al backend. */
export function ImportarAnimalesPage() {
  const navigate = useNavigate();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [tabla, setTabla] = useState<TablaImportada | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [errorArchivo, setErrorArchivo] = useState("");
  const [lotes, setLotes] = useState<string[]>([]);
  const [soloErrores, setSoloErrores] = useState(false);

  useEffect(() => {
    getLotes()
      .then((data) => setLotes(data.map((lote) => lote.nombre)))
      .catch(() => {
        /* sin lotes no se valida que existan; el resto de la revisión sigue */
      });
  }, []);

  const elegirArchivo = async (nuevo: File) => {
    setArchivo(nuevo);
    setTabla(null);
    setErrorArchivo("");
    setSoloErrores(false);
    setLeyendo(true);
    try {
      const leida = await leerPlanilla(nuevo);
      if (leida.encabezados.length === 0) {
        setErrorArchivo("El archivo está vacío.");
      } else {
        setTabla(leida);
      }
    } catch {
      setErrorArchivo(
        "No pudimos leer el archivo. Revisá que sea un CSV o un Excel (.xlsx) válido.",
      );
    } finally {
      setLeyendo(false);
    }
  };

  const quitarArchivo = () => {
    setArchivo(null);
    setTabla(null);
    setErrorArchivo("");
  };

  // Columnas encontradas y, si están todas, la revisión de cada fila.
  const { posiciones, faltantes, filas } = useMemo(() => {
    if (!tabla) return { posiciones: null, faltantes: [], filas: [] };
    const ubicadas = ubicarColumnas(tabla.encabezados);
    const sinColumna = COLUMNAS_IMPORTACION.filter(
      (columna) => ubicadas[columna.clave] < 0,
    );
    return {
      posiciones: ubicadas,
      faltantes: sinColumna,
      filas: sinColumna.length === 0 ? revisarFilas(tabla, lotes) : [],
    };
  }, [tabla, lotes]);
  const listas = filas.filter((fila) => fila.errores.length === 0).length;
  const conErrores = filas.length - listas;
  const filasVisibles = soloErrores
    ? filas.filter((fila) => fila.errores.length > 0)
    : filas;

  const pasoActual = !archivo ? 0 : filas.length > 0 ? 2 : 1;

  return (
    <section className="importar">
      <Button
        variant="ghost"
        className="importar__volver"
        onClick={() => navigate("/rodeo")}>
        <IconArrowLeft size={16} stroke={1.5} />
        Volver al rodeo
      </Button>

      <header className="importar__hero">
        <div className="importar__hero-texto">
          <span className="importar__eyebrow">Rodeo</span>
          <h1>Importar animales</h1>
          <p>
            Subí una planilla con tus animales y los damos de alta en un solo
            paso. Antes de importar vas a poder revisar cada fila.
          </p>
          <ol className="importar__pasos">
            {PASOS.map((paso, i) => (
              <li
                key={paso}
                data-estado={
                  i < pasoActual ? "hecho" : i === pasoActual ? "actual" : "pendiente"
                }>
                <span className="importar__paso-numero">
                  {i < pasoActual ? <IconCircleCheck size={18} stroke={2} /> : i + 1}
                </span>
                {paso}
              </li>
            ))}
          </ol>
        </div>
      </header>

      <div className="importar__cuerpo">
        <section className="importar__formato" aria-labelledby="importar-formato-titulo">
          <div className="importar__formato-header">
            <div>
              <h2 id="importar-formato-titulo">Formato del archivo</h2>
              <p className="importar__ayuda">
                Una fila por animal y los nombres de las columnas en la
                primera fila. El orden de las columnas no importa.
              </p>
            </div>
            <div className="importar__formato-acciones">
              <Button
                variant="outline"
                className="importar__plantilla"
                onClick={descargarPlantilla}>
                <IconDownload size={18} stroke={1.75} />
                Descargar plantilla
              </Button>
              <span className="importar__nota">
                CSV con ";" o "," · Excel .xlsx · hasta 5 MB
              </span>
            </div>
          </div>

          <ul className="importar__columnas">
            {COLUMNAS_IMPORTACION.map((columna) => {
              const Icono = ICONOS_COLUMNA[columna.clave];
              return (
                <li key={columna.clave} data-columna={columna.clave}>
                  <span className="importar__columna-icono" aria-hidden="true">
                    <Icono size={18} stroke={1.75} />
                  </span>
                  <span className="importar__columna-titulo">{columna.titulo}</span>
                  <code>{columna.clave}</code>
                  <span className="importar__columna-formato">
                    {columna.formato}
                  </span>
                  <span className="importar__columna-ejemplo">
                    Ej.: {columna.ejemplo}
                  </span>
                </li>
              );
            })}
          </ul>

          <details className="importar__categorias">
            <summary>Ver categorías aceptadas</summary>
            <div className="importar__categorias-cuerpo">
              {(["HEMBRA", "MACHO"] as const).map((sexo) => (
                <div key={sexo} className="importar__categorias-grupo">
                  <span>{sexo === "HEMBRA" ? "Hembras" : "Machos"}</span>
                  <div>
                    {CATEGORIAS_POR_SEXO[sexo].map((valor) => (
                      <code key={valor}>{valor}</code>
                    ))}
                  </div>
                </div>
              ))}
              <p className="importar__ayuda">
                También se aceptan los nombres en castellano (p. ej. "Vaca
                seca"). Hay {CATEGORIAS_ANIMAL.length} categorías en total.
              </p>
            </div>
          </details>
        </section>

        <div className="importar__principal">
          {!archivo ? (
            <FileUpload.Root
              width="100%"
              alignItems="stretch"
              maxFiles={1}
              accept={TIPOS_ACEPTADOS}
              maxFileSize={TAMANO_MAX_PLANILLA}
              onFileAccept={(details) => {
                const [primero] = details.files;
                if (primero) void elegirArchivo(primero);
              }}
              onFileReject={(details) => {
                const motivo = details.files[0]?.errors[0];
                setErrorArchivo(
                  motivo === "FILE_TOO_LARGE"
                    ? "El archivo supera los 5 MB."
                    : "Solo se aceptan archivos .csv o .xlsx.",
                );
              }}>
              <FileUpload.HiddenInput />
              <FileUpload.Dropzone className="importar__dropzone">
                <span className="importar__dropzone-icono">
                  <IconCloudUpload size={30} stroke={1.5} />
                </span>
                <strong>Arrastrá tu planilla acá</strong>
                <span>o</span>
                <FileUpload.Trigger asChild>
                  <Button colorPalette="brand" size="sm">
                    Elegir archivo
                  </Button>
                </FileUpload.Trigger>
                <span className="importar__dropzone-formatos">
                  CSV o Excel (.xlsx), hasta 5 MB
                </span>
              </FileUpload.Dropzone>
            </FileUpload.Root>
          ) : (
            <div className="importar__archivo">
              <span className="importar__archivo-icono">
                <IconFileSpreadsheet size={24} stroke={1.5} />
              </span>
              <div className="importar__archivo-info">
                <strong>{archivo.name}</strong>
                <span>
                  {formatTamano(archivo.size)}
                  {leyendo
                    ? " · Leyendo…"
                    : tabla &&
                      ` · ${tabla.filas.length} ${tabla.filas.length === 1 ? "fila" : "filas"}`}
                </span>
              </div>
              <button
                type="button"
                className="importar__archivo-quitar"
                aria-label="Quitar archivo"
                onClick={quitarArchivo}>
                <IconX size={16} stroke={2} />
              </button>
            </div>
          )}

          {errorArchivo && (
            <p className="status-message error" role="alert">
              {errorArchivo}
            </p>
          )}

          {tabla && posiciones && (
            <div className="importar__detectadas">
              {COLUMNAS_IMPORTACION.map((columna) => {
                const encontrada = posiciones[columna.clave] >= 0;
                return (
                  <span
                    key={columna.clave}
                    className={`importar__chip importar__chip--${encontrada ? "ok" : "falta"}`}>
                    {encontrada ? (
                      <IconCircleCheck size={14} stroke={2} />
                    ) : (
                      <IconCircleX size={14} stroke={2} />
                    )}
                    {columna.titulo}
                  </span>
                );
              })}
            </div>
          )}

          {faltantes.length > 0 && (
            <div className="importar__aviso" role="alert">
              <IconAlertTriangle size={20} stroke={1.75} />
              <div>
                <strong>
                  {faltantes.length === 1
                    ? "Falta una columna"
                    : `Faltan ${faltantes.length} columnas`}
                </strong>
                <p>
                  Agregá {faltantes.map((c) => `"${c.clave}"`).join(", ")} en
                  la primera fila del archivo, o descargá la plantilla para
                  empezar desde un formato válido.
                </p>
              </div>
            </div>
          )}

          {filas.length > 0 && (
            <div className="importar__revision">
              <div className="importar__resumen">
                <div data-tono="total">
                  <strong>{filas.length}</strong>
                  <span>{filas.length === 1 ? "animal" : "animales"}</span>
                </div>
                <div data-tono="ok">
                  <strong>{listas}</strong>
                  <span>{listas === 1 ? "listo" : "listos"} para importar</span>
                </div>
                <div data-tono={conErrores > 0 ? "error" : undefined}>
                  <strong>{conErrores}</strong>
                  <span>con errores</span>
                </div>
              </div>

              <div className="importar__tabla-card">
                <div className="importar__tabla-header">
                  <h2>Vista previa</h2>
                  {conErrores > 0 && (
                    <label className="importar__solo-errores">
                      <input
                        type="checkbox"
                        checked={soloErrores}
                        onChange={(event) => setSoloErrores(event.target.checked)}
                      />
                      Mostrar solo filas con errores
                    </label>
                  )}
                </div>
                <div className="importar__tabla-scroll">
                  <table className="animales-table importar__tabla">
                    <thead>
                      <tr>
                        <th>Fila</th>
                        {COLUMNAS_IMPORTACION.map((columna) => (
                          <th key={columna.clave}>{columna.titulo}</th>
                        ))}
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filasVisibles.map((fila) => (
                        <tr
                          key={fila.numero}
                          className={
                            fila.errores.length > 0 ? "importar__fila--error" : undefined
                          }>
                          <td className="importar__fila-numero">{fila.numero}</td>
                          {COLUMNAS_IMPORTACION.map((columna) => (
                            <td key={columna.clave}>
                              {fila.valores[columna.clave] || (
                                <span className="importar__vacio">—</span>
                              )}
                            </td>
                          ))}
                          <td>
                            {fila.errores.length === 0 ? (
                              <span className="importar__estado importar__estado--ok">
                                <IconCircleCheck size={14} stroke={2} />
                                Lista
                              </span>
                            ) : (
                              <ul className="importar__errores">
                                {fila.errores.map((error) => (
                                  <li key={error}>{error}</li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="importar__acciones">
        <span className="importar__acciones-nota">
          {filas.length > 0 && conErrores > 0
            ? "Las filas con errores no se importan. Corregilas en el archivo y volvé a subirlo."
            : "Vista previa: la importación todavía no está conectada al backend."}
        </span>
        <Button variant="outline" onClick={() => navigate("/rodeo")}>
          Cancelar
        </Button>
        <Button colorPalette="brand" disabled title="Todavía no está conectado">
          {listas > 0
            ? `Importar ${listas} ${listas === 1 ? "animal" : "animales"}`
            : "Importar animales"}
        </Button>
      </footer>
    </section>
  );
}
