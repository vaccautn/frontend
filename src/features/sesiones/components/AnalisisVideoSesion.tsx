import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@chakra-ui/react";
import { ApiError } from "@/services/httpClient";
import { getStoredUser } from "@/features/auth";
import {
  analisisActivo,
  asociarClaveReintentoAnalisis,
  confirmarClaveReintentoAceptada,
  descartarClaveReintento,
  esMismoArchivoReintento,
  hayResultadosVideoAplicados,
  hayClaveReintento,
  listarAnalisisVideo,
  obtenerClaveReintento,
  puedeResolverAnalisis,
  puedeIniciarCarga,
  puedeReintentarAnalisis,
  reintentarAnalisisVideo,
  resolverAnalisisVideo,
  subirAnalisisVideo,
  validarArchivoVideo,
} from "@/features/sesiones/services/analisisVideoService";
import { crearAnalisisVideoRecovery } from "@/features/sesiones/services/analisisVideoRecovery";
import type { AnalisisVideoRecovery } from "@/features/sesiones/services/analisisVideoRecovery";
import type { AnalisisVideo } from "@/features/sesiones/types/analisisVideo";
import "@/features/sesiones/components/analisisVideo.css";

type Props = {
  sesionId: number;
  sesionAbierta: boolean;
  ordenDisponible: boolean;
  entradasCount: number;
  onResultadosActualizados: () => Promise<void>;
  onRegistrarRefrescoEntradas: (
    request: (() => Promise<void>) | null,
  ) => void;
};

const ESPERA_POLL_MS = 4000;
const ETIQUETAS_ESTADO: Record<string, string> = {
  ENVIANDO: "Enviando al servicio de análisis",
  EN_COLA: "En cola",
  PROCESANDO: "Procesando video",
  IMPORTANDO: "Importando imágenes y resultados",
  COMPLETADO: "Análisis completado",
  ERROR: "Análisis con error",
};

const ETIQUETAS_CC: Record<string, string> = {
  APLICADA: "CC importada",
  CONSERVADA: "CC manual conservada",
  SIN_CC: "CC pendiente",
};

const ETIQUETAS_IMAGEN: Record<string, string> = {
  PENDIENTE: "Imagen pendiente",
  GUARDADA: "Imagen guardada",
  SIN_IMAGEN: "Sin imagen",
  ERROR: "Error al guardar la imagen",
};

function mensajeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return `El servidor rechazó la operación por un conflicto: ${error.detail}`;
    }
    if (error.status >= 500) {
      return "No se pudo confirmar la respuesta del servidor. El envío puede seguir pendiente; se conserva la misma clave para reintentar el mismo archivo.";
    }
    return error.detail;
  }
  return "No se pudo confirmar la respuesta. Revisá la conexión y reintentá con el mismo archivo.";
}

export function AnalisisVideoSesion({
  sesionId,
  sesionAbierta,
  ordenDisponible,
  entradasCount,
  onResultadosActualizados,
  onRegistrarRefrescoEntradas,
}: Props) {
  const usuarioId = getStoredUser()?.id ?? 0;
  const [archivo, setArchivo] = useState<File | null>(null);
  const [analisis, setAnalisis] = useState<AnalisisVideo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [estadoRecuperado, setEstadoRecuperado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [accionId, setAccionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avisoRefresco, setAvisoRefresco] = useState<string | null>(null);
  const [, actualizarRevisionClave] = useState(0);
  const recoveryRef = useRef<AnalisisVideoRecovery | null>(null);
  const inputId = `video-sesion-${sesionId}`;
  const actualizarTabla = useCallback(async () => {
    const recovery = recoveryRef.current;
    if (recovery) {
      await recovery.requestEntriesRefresh();
    } else {
      await onResultadosActualizados();
    }
  }, [onResultadosActualizados]);

  useEffect(() => {
    const recovery = crearAnalisisVideoRecovery({
      load: () => listarAnalisisVideo(sesionId),
      refreshEntries: onResultadosActualizados,
      onItems: (items) => {
        setAnalisis(items);
        setCargando(false);
        setEstadoRecuperado(true);
      },
      onError: () => {
        setCargando(false);
        setError("No se pudo recuperar el estado de los análisis de esta sesión.");
      },
      onRefreshFailure: () => {
        setAvisoRefresco(
          "No se pudo actualizar la tabla de ingresos. Se volverá a intentar sin borrar tus cambios ni cerrar diálogos.",
        );
      },
      onRefreshSuccess: () => setAvisoRefresco(null),
      intervalMs: ESPERA_POLL_MS,
    });
    recoveryRef.current = recovery;
    onRegistrarRefrescoEntradas(recovery.requestEntriesRefresh);
    void recovery.requestEntriesRefresh().catch(() => {
      // The controller retains and retries this refresh while the component is mounted.
    });
    return () => {
      recovery.stop();
      if (recoveryRef.current === recovery) recoveryRef.current = null;
      onRegistrarRefrescoEntradas(null);
    };
  }, [onRegistrarRefrescoEntradas, onResultadosActualizados, sesionId, usuarioId]);

  const activo = analisisActivo(analisis);
  const resultadosYaAplicados = hayResultadosVideoAplicados(analisis);
  const errorArchivo = archivo ? validarArchivoVideo(archivo) : null;
  const clavePendiente = hayClaveReintento(sesionId, usuarioId);
  const coincideArchivoPendiente = Boolean(
    archivo && esMismoArchivoReintento(sesionId, usuarioId, archivo),
  );
  const rechazoAdmisionRetenido = Boolean(
    activo?.estado === "ERROR" &&
      activo.error_code === "ia_admision_rechazada" &&
      activo.limpieza === "RETENIDA",
  );
  const reintentarRechazoAdmision = Boolean(
    rechazoAdmisionRetenido && coincideArchivoPendiente,
  );
  const puedeReenviarEnvioIncierto = Boolean(
    archivo && (activo?.estado === "ENVIANDO" || reintentarRechazoAdmision) && coincideArchivoPendiente,
  );
  const puedeEnviar = puedeIniciarCarga({
    archivoValido: Boolean(archivo && !errorArchivo),
    sesionAbierta,
    ordenDisponible,
    entradasCount,
    estadoActivo: activo?.estado,
    mismoArchivoPendiente: coincideArchivoPendiente,
    clavePendiente,
    reintentoMismoArchivoPermitido: reintentarRechazoAdmision,
    estadoRecuperado,
    resultadosYaAplicados,
    enviando,
  });

  const enviar = async () => {
    if (!archivo || !puedeEnviar || enviando) return;
    setEnviando(true);
    setError(null);
    setAvisoRefresco(null);
    try {
      const clave = obtenerClaveReintento(sesionId, usuarioId, archivo);
      const aceptado = await subirAnalisisVideo(sesionId, archivo, clave);
      if (aceptado.estado !== "ENVIANDO") {
        confirmarClaveReintentoAceptada(sesionId, usuarioId, clave);
      } else {
        asociarClaveReintentoAnalisis(sesionId, usuarioId, clave, aceptado.id);
      }
      setAnalisis((actuales) => [aceptado, ...actuales.filter((item) => item.id !== aceptado.id)]);
      if (["IMPORTANDO", "COMPLETADO"].includes(aceptado.estado)) {
        try {
          await actualizarTabla();
          setAvisoRefresco(null);
        } catch {
          setAvisoRefresco(
            "El análisis se guardó, pero no se pudo actualizar la tabla. Se volverá a intentar automáticamente.",
          );
        }
      }
      setArchivo(null);
      const input = document.getElementById(inputId) as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (uploadError) {
      setError(mensajeError(uploadError));
      try {
        const respuesta = await listarAnalisisVideo(sesionId);
        setAnalisis(respuesta.items);
      } catch {
        // La clave queda persistida para reintentar la misma carga al recuperar la conexión.
      }
    } finally {
      setEnviando(false);
    }
  };

  const descartarClavePendiente = () => {
    if (
      activo ||
      !window.confirm(
        "Se eliminará únicamente la clave guardada en este navegador. Confirmá que no hay un análisis activo y que querés abandonar el reintento de ese archivo.",
      )
    ) {
      return;
    }
    descartarClaveReintento(sesionId, usuarioId);
    actualizarRevisionClave((version) => version + 1);
    setError(null);
  };

  const accionar = async (item: AnalisisVideo, accion: "retry" | "resolve") => {
    if (
      accion === "resolve" &&
      !window.confirm(
        "La resolución es irreversible. Se conservarán resultados y archivos retenidos; solo se liberará el bloqueo de la sesión. ¿Querés continuar?",
      )
    ) {
      return;
    }
    setAccionId(item.id);
    setError(null);
    try {
      if (accion === "retry") {
        const actualizado = await reintentarAnalisisVideo(sesionId, item.id);
        setAnalisis((actuales) =>
          actuales.map((actual) => (actual.id === item.id ? actualizado : actual)),
        );
      } else {
        await resolverAnalisisVideo(sesionId, item.id);
        const respuesta = await listarAnalisisVideo(sesionId);
        setAnalisis(respuesta.items);
      }
    } catch (actionError) {
      setError(mensajeError(actionError));
    } finally {
      setAccionId(null);
    }
  };

  return (
    <section className="analisis-video" aria-labelledby={`video-title-${sesionId}`}>
      <div className="analisis-video__encabezado">
        <div>
          <p className="analisis-video__eyebrow">Análisis de la sesión</p>
          <h2 id={`video-title-${sesionId}`}>Cargar video</h2>
          <p>
            Se usa el orden guardado por el servidor ({entradasCount}{" "}
            {entradasCount === 1 ? "animal" : "animales"}).
          </p>
        </div>
      </div>

      {!sesionAbierta && <p className="analisis-video__nota">Solo se pueden enviar videos mientras la sesión está abierta.</p>}
      {!ordenDisponible && <p className="analisis-video__alerta">No se puede enviar el video porque hay ingresos históricos sin orden verificable.</p>}
      {entradasCount === 0 && <p className="analisis-video__nota">Registrá al menos un ingreso ordenado antes de cargar un video.</p>}
      {resultadosYaAplicados && <p className="analisis-video__alerta">Ya hay resultados de video aplicados en esta sesión. El backend no admite otro análisis de video.</p>}
      {activo && <p className="analisis-video__nota">Hay un análisis en curso o un error retenido. Se bloquea otro envío hasta que termine o se resuelva.</p>}
      {activo?.estado === "ENVIANDO" && !clavePendiente && <p className="analisis-video__alerta">Este navegador no conserva la clave del envío pendiente. No se puede reenviar con seguridad; el estado se seguirá consultando sin crear otro trabajo.</p>}

      <div className="analisis-video__carga">
        <label htmlFor={inputId}>Archivo MP4 o MOV (máximo 50 MiB)</label>
        <input
          id={inputId}
          type="file"
          accept="video/mp4,video/quicktime,.mp4,.mov"
          disabled={!sesionAbierta || !ordenDisponible || entradasCount === 0 || (activo != null && activo.estado !== "ENVIANDO" && !rechazoAdmisionRetenido) || enviando}
          onChange={(event) => {
            setArchivo(event.currentTarget.files?.[0] ?? null);
            setError(null);
          }}
        />
        {archivo && <span className="analisis-video__archivo">{archivo.name} · {(archivo.size / (1024 * 1024)).toFixed(1)} MiB</span>}
        {errorArchivo && <p className="analisis-video__alerta" role="alert">{errorArchivo}</p>}
        {clavePendiente && archivo && !coincideArchivoPendiente && (
          <div className="analisis-video__alerta" role="alert">
            <p>Hay un intento incierto asociado a otro archivo. No se generará una clave nueva automáticamente.</p>
          </div>
        )}
        {clavePendiente && !activo && estadoRecuperado && (
          <Button size="sm" variant="outline" onClick={descartarClavePendiente}>
            Descartar clave pendiente
          </Button>
        )}
        {(activo?.estado === "ENVIANDO" || rechazoAdmisionRetenido) && archivo && !puedeReenviarEnvioIncierto && (
          <p className="analisis-video__alerta" role="alert">
            Para recuperar este intento tenés que seleccionar el mismo archivo que originó la solicitud.
          </p>
        )}
        <Button colorPalette="brand" onClick={enviar} disabled={!puedeEnviar} loading={enviando} loadingText="Enviando video...">
          {enviando ? "Enviando video..." : reintentarRechazoAdmision ? "Reintentar admisión del mismo video" : puedeReenviarEnvioIncierto ? "Reintentar el mismo envío" : "Enviar video"}
        </Button>
        <p className="analisis-video__nota">La carga se envía al backend. El video original no se archiva; las imágenes importadas quedan privadas y accesibles mediante enlaces protegidos.</p>
      </div>

      {error && <p className="analisis-video__alerta" role="alert">{error}</p>}
      {avisoRefresco && (
        <div className="analisis-video__alerta" role="status">
          <p>{avisoRefresco}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void recoveryRef.current?.requestEntriesRefresh().catch(() => {});
            }}>
            Reintentar actualización de ingresos
          </Button>
        </div>
      )}
      <div className="analisis-video__trabajos" aria-live="polite">
        <h3>Estado de los análisis</h3>
        {cargando ? <p>Recuperando análisis guardados...</p> : analisis.length === 0 ? <p>Todavía no hay videos enviados para esta sesión.</p> : analisis.map((item) => (
          <article className="analisis-video__trabajo" key={item.id}>
            <div className="analisis-video__trabajo-titulo">
              <strong>{ETIQUETAS_ESTADO[item.estado] ?? item.estado}</strong>
              <span>{item.entradas_count} ingresos del snapshot</span>
            </div>
            {item.estado === "ENVIANDO" && <p>La admisión puede estar pendiente. Para reenviar, elegí el mismo archivo: se reutiliza la misma clave de idempotencia.</p>}
            {item.error_code === "ia_admision_rechazada" && item.limpieza === "RETENIDA" && <p>El servicio IA rechazó la admisión. Volvé a seleccionar el mismo archivo para reintentar con su clave; también podés resolver el error retenido.</p>}
            {item.estado === "IMPORTANDO" && <p>El backend incorpora imágenes y CC pendientes; las CC manuales existentes se conservan.</p>}
            {item.estado === "ERROR" && <p>El análisis no se considera exitoso. Los resultados aplicados previamente se conservan. Código: {item.error_code ?? "sin detalle"}.</p>}
            {item.pasajes_count !== null && <span>{item.pasajes_count} {item.pasajes_count === 1 ? "pasaje detectado" : "pasajes detectados"}</span>}
            {item.unresolved_count > 0 && <span>{item.unresolved_count} pasajes sin resolución</span>}
            <span>{item.aplicados_count} resultados importados</span>
            {item.discrepancia && <p className="analisis-video__alerta">La cantidad de pasajes no coincide con los ingresos. Revisá las advertencias; el sistema conserva posiciones y no reasigna animales automáticamente.</p>}
            {item.animales_sin_pasaje.length > 0 && <p>Animales sin pasaje: {item.animales_sin_pasaje.join(", ")}.</p>}
            {item.pasajes_sin_asignar.length > 0 && <p>Pasajes extra sin animal asignado: {item.pasajes_sin_asignar.join(", ")}.</p>}
            {item.advertencias.map((advertencia, index) => <p key={`${item.id}-warning-${index}`}>{advertencia}</p>)}
            {item.resultados.map((resultado) => (
              <div className="analisis-video__resultado" key={`${item.id}-${resultado.sequence}`}>
                <span>Posición {resultado.posicion} · {ETIQUETAS_CC[resultado.cc_estado] ?? resultado.cc_estado}</span>
                {!resultado.imagen_url && <span>{ETIQUETAS_IMAGEN[resultado.imagen_estado] ?? resultado.imagen_estado}</span>}
                {resultado.motivo && <span>{resultado.motivo}</span>}
                {resultado.imagen_url && <a href={resultado.imagen_url} target="_blank" rel="noreferrer">Ver imagen importada</a>}
              </div>
            ))}
            {puedeReintentarAnalisis(item) && <Button size="sm" onClick={() => void accionar(item, "retry")} loading={accionId === item.id}>Reintentar análisis guardado</Button>}
            {puedeResolverAnalisis(item) && <Button size="sm" variant="outline" onClick={() => void accionar(item, "resolve")} loading={accionId === item.id}>Resolver error y liberar sesión</Button>}
          </article>
        ))}
      </div>
    </section>
  );
}
