export const LIMITE_VIDEO_BYTES = 50 * 1024 * 1024;

const ESTADOS_ACTIVOS = new Set([
  "ENVIANDO",
  "EN_COLA",
  "PROCESANDO",
  "IMPORTANDO",
]);

export function validarArchivoVideo(
  file: Pick<File, "name" | "size" | "type">,
): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension !== "mp4" && extension !== "mov") {
    return "Elegí un archivo de video MP4 o MOV.";
  }
  if (file.size > LIMITE_VIDEO_BYTES) {
    return "El video supera el límite de 50 MiB.";
  }
  const tipoEsperado = extension === "mp4" ? "video/mp4" : "video/quicktime";
  if (
    file.type &&
    file.type !== tipoEsperado &&
    file.type !== "application/octet-stream"
  ) {
    return "El formato del archivo no coincide con su extensión.";
  }
  return null;
}

export function analisisActivo<T extends { estado: string }>(
  items: T[],
): T | undefined {
  return items.find((item) =>
    ESTADOS_ACTIVOS.has(item.estado) ||
    (item.estado === "ERROR" && "limpieza" in item && item.limpieza === "RETENIDA"),
  );
}

export function seleccionarAnalisisVisible<T extends { estado: string }>(
  items: T[],
): T | undefined {
  return analisisActivo(items) ?? items[0];
}

export function mensajeEstadoAnalisis(item: {
  estado: string;
  limpieza: string;
  error_code?: string | null;
}): string {
  switch (item.estado) {
    case "ENVIANDO":
      return "Esperando confirmación del envío…";
    case "EN_COLA":
      return "Esperando procesamiento…";
    case "PROCESANDO":
      return "Analizando video…";
    case "IMPORTANDO":
      return item.error_code
        ? "No se pudo guardar un resultado. El análisis sigue en curso."
        : "Guardando resultados…";
    case "COMPLETADO":
      return "Análisis completado. Resultados disponibles en la sesión.";
    case "ERROR":
      return item.error_code === "ia_admision_rechazada" && item.limpieza === "RETENIDA"
        ? "No se pudo iniciar el análisis. Seleccioná el mismo video para reintentar o resolvé el error."
        : item.limpieza === "RETENIDA"
          ? "No se pudo completar el análisis. Podés reintentarlo o resolver el error."
          : "No se pudo completar el análisis.";
    default:
      return "Consultando el estado del análisis…";
  }
}

export function puedeReintentarAnalisis(item: {
  estado: string;
  limpieza: string;
  error_code?: string | null;
}): boolean {
  return (
    item.estado === "ERROR" &&
    item.limpieza === "RETENIDA" &&
    item.error_code !== "ia_admision_rechazada"
  );
}

export function puedeResolverAnalisis(item: {
  estado: string;
  limpieza: string;
  acceso_restringido?: boolean;
}): boolean {
  return (
    (item.estado === "ERROR" && item.limpieza === "RETENIDA") ||
    (item.acceso_restringido === true &&
      item.estado === "ENVIANDO" &&
      item.limpieza === "PENDIENTE")
  );
}

type PendingVideoUpload = {
  key: string;
  name: string;
  size: number;
  lastModified: number;
  analysisId?: string;
};

function leerMetadataPendiente(
  sesionId: number,
  usuarioId: number,
  storage: Storage,
): PendingVideoUpload | null {
  const stored = storage.getItem(`video-upload:${usuarioId}:${sesionId}`);
  if (!stored) return null;
  try {
    const metadata = JSON.parse(stored) as Partial<PendingVideoUpload>;
    if (
      typeof metadata.key === "string" &&
      typeof metadata.name === "string" &&
      typeof metadata.size === "number" &&
      typeof metadata.lastModified === "number" &&
      (metadata.analysisId === undefined || typeof metadata.analysisId === "string")
    ) {
      return metadata as PendingVideoUpload;
    }
  } catch {
    return null;
  }
  return null;
}

export function obtenerIntentoPendiente(
  sesionId: number,
  usuarioId: number,
  storage: Storage = sessionStorage,
): PendingVideoUpload | null {
  const metadata = leerMetadataPendiente(sesionId, usuarioId, storage);
  return metadata ? { ...metadata } : null;
}

function coincideArchivoPendiente(
  metadata: PendingVideoUpload | null,
  file: Pick<File, "name" | "size" | "lastModified">,
): boolean {
  return Boolean(
    metadata &&
      metadata.name === file.name &&
      metadata.size === file.size &&
      metadata.lastModified === file.lastModified,
  );
}

export function esMismoArchivoReintento(
  sesionId: number,
  usuarioId: number,
  file: Pick<File, "name" | "size" | "lastModified">,
  storage: Storage = sessionStorage,
): boolean {
  return coincideArchivoPendiente(
    leerMetadataPendiente(sesionId, usuarioId, storage),
    file,
  );
}

export function hayClaveReintento(
  sesionId: number,
  usuarioId: number,
  storage: Storage = sessionStorage,
): boolean {
  return storage.getItem(`video-upload:${usuarioId}:${sesionId}`) !== null;
}

export function obtenerClaveReintento(
  sesionId: number,
  usuarioId: number,
  file: Pick<File, "name" | "size" | "lastModified">,
  storage: Storage = sessionStorage,
  crearUuid: () => string = () => crypto.randomUUID(),
): string {
  const key = `video-upload:${usuarioId}:${sesionId}`;
  const stored = storage.getItem(key);
  if (stored) {
    const previous = leerMetadataPendiente(sesionId, usuarioId, storage);
    if (!previous) {
      throw new Error(
        "No se pudo validar la clave de un envío pendiente. Confirmá su descarte antes de iniciar otro.",
      );
    }
    if (coincideArchivoPendiente(previous, file)) {
      return previous.key;
    }
    throw new Error(
      "Hay un envío pendiente asociado a otro archivo. Confirmá su descarte antes de iniciar uno distinto.",
    );
  }

  const idempotencyKey = crearUuid();
  storage.setItem(
    key,
    JSON.stringify({
      key: idempotencyKey,
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
    }),
  );
  return idempotencyKey;
}

export function confirmarClaveReintentoAceptada(
  sesionId: number,
  usuarioId: number,
  idempotencyKey: string,
  storage: Storage = sessionStorage,
): boolean {
  const metadata = leerMetadataPendiente(sesionId, usuarioId, storage);
  if (!metadata || metadata.key !== idempotencyKey) return false;
  storage.removeItem(`video-upload:${usuarioId}:${sesionId}`);
  return true;
}

export function asociarClaveReintentoAnalisis(
  sesionId: number,
  usuarioId: number,
  idempotencyKey: string,
  analysisId: string,
  storage: Storage = sessionStorage,
): boolean {
  const metadata = leerMetadataPendiente(sesionId, usuarioId, storage);
  if (
    !metadata ||
    metadata.key !== idempotencyKey ||
    (metadata.analysisId !== undefined && metadata.analysisId !== analysisId)
  ) {
    return false;
  }
  storage.setItem(
    `video-upload:${usuarioId}:${sesionId}`,
    JSON.stringify({ ...metadata, analysisId }),
  );
  return true;
}

export function limpiarIntentoResueltoSiCoincide(
  sesionId: number,
  usuarioId: number,
  idempotencyKey: string,
  analysisId: string,
  storage: Storage = sessionStorage,
): boolean {
  const metadata = leerMetadataPendiente(sesionId, usuarioId, storage);
  if (
    !metadata ||
    metadata.key !== idempotencyKey ||
    metadata.analysisId !== analysisId
  ) {
    return false;
  }
  storage.removeItem(`video-upload:${usuarioId}:${sesionId}`);
  return true;
}

export function descartarClaveReintento(
  sesionId: number,
  usuarioId: number,
  storage: Storage = sessionStorage,
): void {
  storage.removeItem(`video-upload:${usuarioId}:${sesionId}`);
}

export function crearCargaVideo(file: File, idempotencyKey: string) {
  const body = new FormData();
  body.append("file", file);
  return { body, headers: { "Idempotency-Key": idempotencyKey } };
}

export function puedeIniciarCarga(params: {
  archivoValido: boolean;
  sesionAbierta: boolean;
  ordenDisponible: boolean;
  entradasCount: number;
  estadoActivo?: string;
  mismoArchivoPendiente: boolean;
  clavePendiente: boolean;
  reintentoMismoArchivoPermitido?: boolean;
  estadoRecuperado: boolean;
  resultadosYaAplicados: boolean;
  enviando: boolean;
}): boolean {
  return Boolean(
    params.archivoValido &&
      params.sesionAbierta &&
      params.ordenDisponible &&
      params.entradasCount > 0 &&
      params.estadoRecuperado &&
      !params.resultadosYaAplicados &&
      (!params.clavePendiente || params.mismoArchivoPendiente) &&
      (!params.estadoActivo ||
        ((params.estadoActivo === "ENVIANDO" || params.reintentoMismoArchivoPermitido) &&
          params.mismoArchivoPendiente)) &&
      !params.enviando,
  );
}

export function hayResultadosVideoAplicados(
  items: Array<{ aplicados_count?: number; resultados_aplicados?: boolean }>,
): boolean {
  return items.some(
    (item) => item.resultados_aplicados === true || (item.aplicados_count ?? 0) > 0,
  );
}

export function iniciarPollingSecuencial<T>(
  cargar: () => Promise<T>,
  alRecibir: (value: T) => void | Promise<void>,
  alFallar: (error: unknown) => void,
  intervaloMs: number,
  programar: (callback: () => void, delay: number) => ReturnType<typeof setTimeout> = setTimeout,
  cancelar: (timer: ReturnType<typeof setTimeout>) => void = clearTimeout,
): () => void {
  let cancelado = false;
  let temporizador: ReturnType<typeof setTimeout> | undefined;

  const consultar = async () => {
    try {
      const value = await cargar();
      if (!cancelado) await alRecibir(value);
    } catch (error) {
      if (!cancelado) alFallar(error);
    }
    if (!cancelado) {
      temporizador = programar(() => void consultar(), intervaloMs);
    }
  };

  void consultar();
  return () => {
    cancelado = true;
    if (temporizador !== undefined) cancelar(temporizador);
  };
}
