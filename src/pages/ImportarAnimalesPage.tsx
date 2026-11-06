import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, FileUpload, Spinner } from "@chakra-ui/react";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCircleCheck,
  IconCircleX,
  IconCloudUpload,
  IconFileSpreadsheet,
  IconX,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import { getLotes } from "@/features/lotes/services/lotesService";
import type { LoteOption } from "@/features/lotes/types";
import { ApiError } from "@/services/httpClient";
import {
  analizarPlanilla,
  confirmarImportacion,
  descargarArchivoErrores,
} from "@/features/animales/services/importacionService";
import type {
  AnalisisImportacion,
  ResultadoImportacion as Resultado,
} from "@/features/animales/types/importacion";
import {
  COLUMNAS_IMPORTACION,
  TAMANO_MAX_PLANILLA,
  TIPOS_ACEPTADOS,
  armarArchivoErrores,
  armarConfirmacion,
  consultasPendientes,
  type Decisiones,
} from "@/features/animales/utils/importacionAnimales";
import { PasosImportacion } from "@/features/animales/components/importacion/PasosImportacion";
import { FormatoArchivo } from "@/features/animales/components/importacion/FormatoArchivo";
import { ConsultaCard } from "@/features/animales/components/importacion/ConsultaCard";
import { TablaRevision } from "@/features/animales/components/importacion/TablaRevision";
import { ConfirmarImportacionDialog } from "@/features/animales/components/importacion/ConfirmarImportacionDialog";
import { ResultadoImportacion } from "@/features/animales/components/importacion/ResultadoImportacion";
import "@/features/animales/components/animales.css";
import "@/features/animales/components/importar-animales.css";

type Fase = "inicio" | "analizando" | "revision" | "importando" | "resultado";

function formatTamano(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function mensajeDeError(error: unknown, porDefecto: string) {
  return error instanceof ApiError ? error.detail : porDefecto;
}

/** Importar animales desde CSV o Excel. El backend lee y valida el archivo
 * (analizar), el productor resuelve las dudas y el backend vuelve a validar
 * todo al importar (confirmar). Ver backend/docs/routers/importacion.md. */
export function ImportarAnimalesPage() {
  const navigate = useNavigate();
  const [fase, setFase] = useState<Fase>("inicio");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [analisis, setAnalisis] = useState<AnalisisImportacion | null>(null);
  const [errorArchivo, setErrorArchivo] = useState("");
  const [decisiones, setDecisiones] = useState<Decisiones>({});
  const [lotes, setLotes] = useState<LoteOption[]>([]);
  const [lotesError, setLotesError] = useState(false);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [descargando, setDescargando] = useState(false);

  const cargarLotes = useCallback(() => {
    getLotes()
      .then((data) => {
        setLotes(data);
        setLotesError(false);
      })
      .catch(() => setLotesError(true));
  }, []);

  useEffect(cargarLotes, [cargarLotes]);

  // Mientras se importa, avisar antes de cerrar o recargar la página.
  useEffect(() => {
    if (fase !== "importando") return;
    const avisar = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [fase]);

  const reiniciar = () => {
    setFase("inicio");
    setArchivo(null);
    setAnalisis(null);
    setErrorArchivo("");
    setDecisiones({});
    setResultado(null);
  };

  const elegirArchivo = async (nuevo: File) => {
    reiniciar();
    setArchivo(nuevo);
    setFase("analizando");
    try {
      setAnalisis(await analizarPlanilla(nuevo));
      setFase("revision");
    } catch (error) {
      setErrorArchivo(mensajeDeError(error, "No pudimos analizar el archivo. Probá nuevamente."));
      setFase("inicio");
    }
  };

  const filasPorNumero = useMemo(
    () => new Map((analisis?.filas ?? []).map((fila) => [fila.numero, fila])),
    [analisis],
  );
  const confirmacion = useMemo(
    () => (analisis ? armarConfirmacion(analisis, decisiones) : null),
    [analisis, decisiones],
  );
  const pendientes = analisis ? consultasPendientes(analisis.consultas, decisiones).length : 0;
  const conFilas = !!analisis && analisis.filas.length > 0;
  const aImportar = confirmacion ? confirmacion.payload.filas.length - confirmacion.sinResolver.length : 0;
  const pasoActual = !archivo ? 0 : conFilas || fase === "resultado" ? 2 : 1;

  const importar = async () => {
    if (!confirmacion) return;
    setDialogoAbierto(false);
    setFase("importando");
    try {
      const respuesta = await confirmarImportacion(confirmacion.payload);
      setResultado(respuesta);
      setFase("resultado");
      const cargados = respuesta.creados + respuesta.actualizados + respuesta.reactivados;
      if (cargados > 0) {
        toast.success(`Se importaron ${cargados} ${cargados === 1 ? "animal" : "animales"}.`);
      }
      cargarLotes();
    } catch (error) {
      toast.error(mensajeDeError(error, "No se pudo completar la importación. Probá nuevamente."));
      setFase("revision");
    }
  };

  const descargarErrores = async () => {
    if (!analisis || !resultado) return;
    setDescargando(true);
    try {
      await descargarArchivoErrores(armarArchivoErrores(analisis, resultado));
    } catch (error) {
      toast.error(mensajeDeError(error, "No se pudo generar el archivo con errores."));
    } finally {
      setDescargando(false);
    }
  };

  return (
    <section className="importar">
      <Button variant="ghost" className="importar__volver" onClick={() => navigate("/rodeo")}>
        <IconArrowLeft size={16} stroke={1.5} />
        Volver al rodeo
      </Button>

      <header className="importar__hero">
        <div className="importar__hero-texto">
          <span className="importar__eyebrow">Rodeo</span>
          <h1>Importar animales</h1>
          <PasosImportacion pasoActual={pasoActual} />
        </div>
      </header>

      <div className="importar__cuerpo">
        {fase !== "resultado" && <FormatoArchivo lotes={lotes} lotesError={lotesError} />}

        <div className="importar__principal">
          {resultado && analisis ? (
            <ResultadoImportacion
              resultado={resultado}
              noCargadas={resultado.con_errores + analisis.resumen.con_errores}
              descargando={descargando}
              onDescargarErrores={descargarErrores}
              onSubirCorregido={reiniciar}
              onTerminar={() => navigate("/rodeo", { state: { refresh: true } })}
            />
          ) : !archivo ? (
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
              <FileUpload.HiddenInput aria-label="Elegir planilla" />
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
                <span className="importar__dropzone-formatos">CSV o Excel (.xlsx), hasta 5 MB</span>
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
                  {analisis?.hoja && ` · hoja «${analisis.hoja}»`}
                  {conFilas &&
                    ` · ${analisis.filas.length} ${analisis.filas.length === 1 ? "fila" : "filas"}`}
                </span>
              </div>
              {fase === "analizando" ? (
                <span className="importar__analizando" role="status">
                  <Spinner size="sm" color="var(--accent)" />
                  Analizando tu planilla…
                </span>
              ) : (
                <button
                  type="button"
                  className="importar__archivo-quitar"
                  aria-label="Quitar archivo"
                  onClick={reiniciar}
                  disabled={fase === "importando"}>
                  <IconX size={16} stroke={2} />
                </button>
              )}
            </div>
          )}

          {errorArchivo && (
            <p className="status-message error" role="alert">
              {errorArchivo}
            </p>
          )}

          {analisis && fase !== "resultado" && (
            <div className="importar__detectadas">
              {COLUMNAS_IMPORTACION.map((columna) => {
                const encontrada = !analisis.columnas_faltantes.includes(columna.clave);
                return (
                  <span
                    key={columna.clave}
                    className={`importar__chip importar__chip--${encontrada ? "ok" : "falta"}`}>
                    {encontrada ? <IconCircleCheck size={14} stroke={2} /> : <IconCircleX size={14} stroke={2} />}
                    {columna.titulo}
                  </span>
                );
              })}
            </div>
          )}

          {analisis && analisis.columnas_faltantes.length > 0 && (
            <div className="importar__aviso" role="alert">
              <IconAlertTriangle size={20} stroke={1.75} />
              <div>
                <strong>
                  {analisis.columnas_faltantes.length === 1
                    ? "Falta una columna"
                    : `Faltan ${analisis.columnas_faltantes.length} columnas`}
                </strong>
                <p>
                  Agregá {analisis.columnas_faltantes.map((c) => `"${c}"`).join(", ")} en la primera
                  fila del archivo, o descargá la plantilla para empezar desde un formato válido.
                  {analisis.hojas_revisadas.length > 1 &&
                    ` Revisamos las hojas: ${analisis.hojas_revisadas.join(", ")}.`}
                </p>
              </div>
            </div>
          )}

          {conFilas && fase !== "resultado" && (
            <div className="importar__revision">
              <div className="importar__resumen">
                <div data-tono="total">
                  <strong>{analisis.resumen.total}</strong>
                  <span>{analisis.resumen.total === 1 ? "animal" : "animales"} en el archivo</span>
                </div>
                <div data-tono="ok">
                  <strong>{analisis.resumen.listas}</strong>
                  <span>{analisis.resumen.listas === 1 ? "listo" : "listos"} para importar</span>
                </div>
                <div data-tono={analisis.resumen.con_consultas > 0 ? "consulta" : undefined}>
                  <strong>{analisis.resumen.con_consultas}</strong>
                  <span>requieren tu decisión</span>
                </div>
                <div data-tono={analisis.resumen.con_errores > 0 ? "error" : undefined}>
                  <strong>{analisis.resumen.con_errores}</strong>
                  <span>con errores</span>
                </div>
              </div>

              {analisis.consultas.length > 0 && (
                <section className="importar__consultas" aria-labelledby="importar-consultas-titulo">
                  <div className="importar__consultas-header">
                    <h2 id="importar-consultas-titulo">Necesitamos tu confirmación</h2>
                    <p className="importar__ayuda">
                      {pendientes === 0
                        ? "Ya decidiste todo. Podés importar."
                        : `Te ${pendientes === 1 ? "queda 1 decisión" : `quedan ${pendientes} decisiones`}. Cada una se aplica a todas las filas que la comparten; si querés, podés decidir fila por fila. Lo que no decidas no se importa.`}
                    </p>
                  </div>
                  {analisis.consultas.map((consulta) => (
                    <ConsultaCard
                      key={consulta.clave}
                      consulta={consulta}
                      decision={decisiones[consulta.clave]}
                      filas={filasPorNumero}
                      onCambiar={(decision) =>
                        setDecisiones((actuales) => ({ ...actuales, [consulta.clave]: decision }))
                      }
                    />
                  ))}
                </section>
              )}

              <TablaRevision filas={analisis.filas} />
            </div>
          )}
        </div>
      </div>

      {conFilas && confirmacion && (fase === "revision" || fase === "importando") && (
        <footer className="importar__acciones">
          <span className="importar__acciones-nota">
            {pendientes > 0
              ? `Faltan ${pendientes} ${pendientes === 1 ? "decisión" : "decisiones"}: esas filas no se importan hasta que decidas.`
              : analisis.resumen.con_errores > 0
                ? "Las filas con errores no se importan: al terminar vas a poder descargarlas para corregirlas."
                : "Todo listo para importar."}
          </span>
          <Button variant="outline" onClick={() => navigate("/rodeo")}>
            Cancelar
          </Button>
          <Button colorPalette="brand" disabled={aImportar <= 0} onClick={() => setDialogoAbierto(true)}>
            Importar {aImportar} {aImportar === 1 ? "animal" : "animales"}
          </Button>
        </footer>
      )}

      {confirmacion && (
        <ConfirmarImportacionDialog
          open={dialogoAbierto}
          confirmacion={confirmacion}
          filasConError={analisis?.resumen.con_errores ?? 0}
          onCancelar={() => setDialogoAbierto(false)}
          onConfirmar={importar}
        />
      )}

      {fase === "importando" && (
        <div className="importar__cargando" role="status" aria-live="assertive">
          <div className="importar__cargando-tarjeta">
            <Spinner size="xl" color="var(--accent)" borderWidth="3px" />
            <strong>
              Importando {aImportar} {aImportar === 1 ? "animal" : "animales"}…
            </strong>
            <span>Esto puede tardar unos segundos. No cierres esta página.</span>
          </div>
        </div>
      )}
    </section>
  );
}
