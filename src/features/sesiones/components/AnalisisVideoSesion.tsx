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
  obtenerIntentoPendiente,
  reintentarAnalisisVideo,
  resolverAnalisisVideo,
  subirAnalisisVideo,
  validarArchivoVideo,
} from "@/features/sesiones/services/analisisVideoService";
import {
  mensajeEstadoAnalisis,
  seleccionarAnalisisVisible,
} from "@/features/sesiones/services/analisisVideoUtils";
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
  const [errorConsulta, setErrorConsulta] = useState<string | null>(null);
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
        setErrorConsulta(null);
      },
      onError: () => {
        setCargando(false);
        setErrorConsulta("No se pudo recuperar el estado de los análisis de esta sesión.");
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
  const analisisVisible = seleccionarAnalisisVisible(analisis);
  const erroresRetenidos = analisis.filter(
    (item) => puedeResolverAnalisis(item) && item.id !== analisisVisible?.id,
  );
  const discrepancia = analisis.find(
    (item) => !item.acceso_restringido && item.discrepancia,
  );
  const resultadosYaAplicados = hayResultadosVideoAplicados(analisis);
  const errorArchivo = archivo ? validarArchivoVideo(archivo) : null;
  const clavePendiente = hayClaveReintento(sesionId, usuarioId);
  const intentoPendiente = obtenerIntentoPendiente(sesionId, usuarioId);
  const coincideArchivoPendiente = Boolean(
    archivo && esMismoArchivoReintento(sesionId, usuarioId, archivo),
  );
  const recoveryKey = activo?.acceso_restringido ? null : activo?.recovery_key;
  const recoveryKeyCompatible = Boolean(
    recoveryKey && (!intentoPendiente || intentoPendiente.key === recoveryKey),
  );
  const mismoIntento = recoveryKey
    ? recoveryKeyCompatible &&
      (coincideArchivoPendiente || !intentoPendiente)
    : coincideArchivoPendiente;
  const rechazoAdmisionRetenido = Boolean(
    activo?.estado === "ERROR" &&
      activo.error_code === "ia_admision_rechazada" &&
      activo.limpieza === "RETENIDA",
  );
  const reintentarRechazoAdmision = Boolean(
    rechazoAdmisionRetenido && mismoIntento,
  );
  const puedeReenviarEnvioIncierto = Boolean(
    archivo && (activo?.estado === "ENVIANDO" || reintentarRechazoAdmision) && mismoIntento,
  );
  const puedeEnviar = puedeIniciarCarga({
    archivoValido: Boolean(archivo && !errorArchivo),
    sesionAbierta,
    ordenDisponible,
    entradasCount,
    estadoActivo: activo?.estado,
    mismoArchivoPendiente: mismoIntento,
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
      const clave = recoveryKeyCompatible && recoveryKey
        ? recoveryKey
        : obtenerClaveReintento(sesionId, usuarioId, archivo);
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
        item.acceso_restringido && item.estado === "ENVIANDO"
          ? "La IA todavía podría haber aceptado este envío. Se conservará el estado incierto y no se eliminarán archivos remotos. La resolución es irreversible y liberará el bloqueo de la sesión. ¿Querés continuar?"
          : "La resolución es irreversible. Se conservarán resultados y archivos retenidos; solo se liberará el bloqueo de la sesión. ¿Querés continuar?",
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
        </div>
      </div>

      {!sesionAbierta && <p className="analisis-video__nota">Solo se pueden enviar videos mientras la sesión está abierta.</p>}
      {!ordenDisponible && <p className="analisis-video__alerta">No se puede enviar el video porque hay ingresos históricos sin orden verificable.</p>}
      {entradasCount === 0 && <p className="analisis-video__nota">Registrá al menos un ingreso ordenado antes de cargar un video.</p>}
      {activo?.estado === "ENVIANDO" && !clavePendiente && !recoveryKey && !activo.acceso_restringido && <p className="analisis-video__alerta">Este navegador no conserva la clave del envío pendiente. No se puede reenviar con seguridad; el estado se seguirá consultando sin crear otro trabajo.</p>}

      <div className="analisis-video__carga">
        <label htmlFor={inputId}>Archivo MP4 o MOV (máximo 50 MiB)</label>
        <input
          id={inputId}
          type="file"
          accept="video/mp4,video/quicktime,.mp4,.mov"
          disabled={!sesionAbierta || !ordenDisponible || entradasCount === 0 || activo?.acceso_restringido === true || (activo != null && activo.estado !== "ENVIANDO" && !rechazoAdmisionRetenido) || enviando}
          onChange={(event) => {
            setArchivo(event.currentTarget.files?.[0] ?? null);
            setError(null);
          }}
        />
        {archivo && <span className="analisis-video__archivo">{archivo.name} · {(archivo.size / (1024 * 1024)).toFixed(1)} MiB</span>}
        {errorArchivo && <p className="analisis-video__alerta" role="alert">{errorArchivo}</p>}
        {clavePendiente && archivo && !coincideArchivoPendiente && !recoveryKeyCompatible && (
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
        {enviando && (
          <div className="analisis-video__progreso" role="status" aria-live="polite">
            <span>Subiendo video…</span>
            <div
              className="analisis-video__barra"
              role="progressbar"
              aria-label="Subiendo video"
              aria-valuetext="Progreso indeterminado"
            />
          </div>
        )}
      </div>

      {errorConsulta && <p className="analisis-video__alerta" role="alert">{errorConsulta}</p>}
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
      {!cargando && analisisVisible && !enviando && (
        <div className="analisis-video__estado" role="status" aria-live="polite">
          <span>
            {analisisVisible.acceso_restringido
              ? "Este análisis conserva su estado, pero el acceso a sus datos fue revocado. Podés resolver el bloqueo sin consultar el contenido."
              : mensajeEstadoAnalisis(analisisVisible)}
          </span>
          {!["COMPLETADO", "ERROR"].includes(analisisVisible.estado) &&
            !(analisisVisible.estado === "IMPORTANDO" && analisisVisible.error_code) && (
              <div
                className="analisis-video__barra"
                role="progressbar"
                aria-label="Estado del análisis de video"
                aria-valuetext="Progreso indeterminado"
              />
            )}
          {(analisisVisible.estado === "ERROR" ||
            (analisisVisible.acceso_restringido && analisisVisible.estado === "ENVIANDO")) && (
            <div className="analisis-video__acciones">
              {!analisisVisible.acceso_restringido && puedeReintentarAnalisis(analisisVisible) && <Button size="sm" onClick={() => void accionar(analisisVisible, "retry")} loading={accionId === analisisVisible.id}>Reintentar</Button>}
              {puedeResolverAnalisis(analisisVisible) && <Button size="sm" variant="outline" onClick={() => void accionar(analisisVisible, "resolve")} loading={accionId === analisisVisible.id}>Resolver error</Button>}
            </div>
          )}
        </div>
      )}
      {discrepancia && <p className="analisis-video__alerta">La cantidad detectada no coincide con los ingresos de la sesión.</p>}
      {erroresRetenidos.map((item) => (
        <div className="analisis-video__error" key={item.id}>
          <span>
            {item.acceso_restringido
              ? "El análisis conserva un error y acceso restringido. Podés resolver el bloqueo sin consultar el contenido."
              : mensajeEstadoAnalisis(item)}
          </span>
          <div className="analisis-video__acciones">
            {!item.acceso_restringido && puedeReintentarAnalisis(item) && <Button size="sm" onClick={() => void accionar(item, "retry")} loading={accionId === item.id}>Reintentar</Button>}
            {puedeResolverAnalisis(item) && <Button size="sm" variant="outline" onClick={() => void accionar(item, "resolve")} loading={accionId === item.id}>Resolver error</Button>}
          </div>
        </div>
      ))}
    </section>
  );
}
