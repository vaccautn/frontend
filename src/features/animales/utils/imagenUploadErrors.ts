import { normalizeBackendDetail } from "@/features/auth";
import { ApiError } from "@/services/httpClient";

const MENSAJE_LOTE_CANCELADO =
  " Como subiste varias fotos juntas, no se guardó ninguna: el rechazo de una cancela el lote completo.";

/**
 * Traduce el error de POST /evaluaciones-cc/{id}/imagenes a un mensaje para el
 * usuario. 400 y 422 son los status con los que el backend rechaza una imagen
 * por no detectar un bovino (422 llega con el detail crudo de validación,
 * p. ej. "el valor no es suficiente", que no queremos mostrar tal cual); 502
 * es el servicio de IA caído. El resto de los status ya vienen con un detail
 * claro.
 */
export function getImagenUploadErrorMessage(
  error: unknown,
  cantidadArchivos = 1,
): string {
  if (!(error instanceof ApiError)) {
    return "No pudimos subir la imagen. Probá nuevamente.";
  }

  let mensaje: string;
  switch (error.status) {
    case 400:
    case 422:
      mensaje =
        "No pudimos comprobar que la imagen contenía un bovino. Probá con otra foto, más cerca y con buena luz.";
      break;
    case 502:
      mensaje =
        "El servicio de validación no está disponible en este momento. Intentá de nuevo en unos minutos.";
      break;
    default:
      mensaje =
        normalizeBackendDetail(error.detail) ||
        "No pudimos subir la imagen. Probá nuevamente.";
  }

  if (cantidadArchivos > 1) {
    mensaje += MENSAJE_LOTE_CANCELADO;
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
