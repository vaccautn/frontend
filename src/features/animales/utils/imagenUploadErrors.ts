import { normalizeBackendDetail } from "../../auth/utils/authMessages.ts";
import { ApiError } from "../../../services/httpClient.ts";

const MENSAJE_LOTE_CANCELADO =
  " Como subiste varias fotos juntas, no se guardó ninguna: el rechazo de una cancela el lote completo.";

const IMAGE_ERROR_MESSAGES: Record<string, string> = {
  image_no_cow: "El detector no detectó un bovino en la imagen. Utilice otra foto con el animal visible.",
  image_low_confidence: "Se detectó un bovino, pero la confianza es inferior al mínimo requerido de 80 %. Utilice una foto más cercana y con buena luz.",
  image_detection_timeout: "El servicio de detección agotó el tiempo de espera. Intente nuevamente.",
  image_detection_unavailable: "El servicio de detección no está disponible o no pudo procesar la imagen. Intente nuevamente más tarde.",
  image_detection_invalid_response: "El servicio de detección devolvió una respuesta inválida. Intente nuevamente más tarde.",
  image_storage_unavailable: "No se pudo guardar la imagen en el servicio de almacenamiento. Intente nuevamente más tarde.",
};

/** Distinguish detection rejections from validation, storage and transport failures. */
export function getImagenUploadErrorMessage(
  error: unknown,
  cantidadArchivos = 1,
): string {
  if (!(error instanceof ApiError)) {
    return error instanceof TypeError
      ? "No se pudo conectar con el servidor. Verifique la conexión y que el servidor esté disponible. Recargue la evaluación para comprobar si la imagen se guardó antes de reintentar."
      : "No se pudo confirmar la subida de la imagen. Recargue la evaluación antes de reintentar.";
  }

  let mensaje: string;
  switch (error.status) {
    case 400:
      mensaje = "No se pudo aceptar la imagen. Revise el archivo e intente nuevamente.";
      break;
    case 422:
      mensaje = error.detail === "El archivo está vacío"
        ? "El archivo está vacío. Seleccione una imagen JPG o PNG con contenido."
        : "La solicitud de subida no es válida. Seleccione nuevamente el archivo JPG o PNG e intente otra vez.";
      break;
    case 401:
      mensaje = "La sesión venció o no es válida. Inicie sesión nuevamente.";
      break;
    case 403:
      mensaje = "No tiene permiso para adjuntar imágenes a esta evaluación.";
      break;
    case 413:
      mensaje = "La imagen supera el tamaño máximo de 10 MB.";
      break;
    case 415:
      mensaje = "Formato no admitido. Seleccione una imagen JPG o PNG.";
      break;
    case 502:
      mensaje = typeof error.detail === "string" && error.detail.includes("condición corporal")
        ? "El servicio de condición corporal devolvió una respuesta inválida. No se guardó la imagen; intente nuevamente más tarde."
        : error.detail === "Error al subir la imagen al servicio de almacenamiento"
          ? IMAGE_ERROR_MESSAGES.image_storage_unavailable
          : "El servidor no pudo completar la subida. Intente nuevamente más tarde.";
      break;
    default:
      mensaje =
        normalizeBackendDetail(error.detail) ||
        "No pudimos subir la imagen. Probá nuevamente.";
  }

  const code = error.data?.code;
  if (typeof code === "string" && Object.hasOwn(IMAGE_ERROR_MESSAGES, code)) {
    mensaje = IMAGE_ERROR_MESSAGES[code];
  }

  if (cantidadArchivos > 1) {
    mensaje += error.status < 500
      ? MENSAJE_LOTE_CANCELADO
      : " Recargue la evaluación para comprobar el estado del lote antes de reintentar.";
  }

  return mensaje;
}

/** Mismos límites que valida el backend en POST /evaluaciones-cc/{id}/imagenes. */
export const FORMATOS_IMAGEN = ["image/jpeg", "image/png"];
export const ACCEPT_IMAGEN = FORMATOS_IMAGEN.join(",");
export const TAMANO_MAX_IMAGEN = 10 * 1024 * 1024;

/**
 * Valida formato (JPG/PNG) y tamaño antes de subir. Devuelve el mensaje de
 * error del primer archivo inválido, o null si todos son válidos. El
 * `accept` del input no alcanza: el usuario puede elegir "Todos los archivos"
 * o arrastrar cualquier cosa.
 */
export function validarImagenes(files: File[]): string | null {
  for (const file of files) {
    if (!FORMATOS_IMAGEN.includes(file.type)) {
      return `"${file.name}" no es una imagen válida. Se aceptan solo JPG y PNG.`;
    }
    if (file.size === 0) {
      return `"${file.name}" está vacío.`;
    }
    if (file.size > TAMANO_MAX_IMAGEN) {
      return `"${file.name}" supera el tamaño máximo de 10 MB.`;
    }
  }
  return null;
}
