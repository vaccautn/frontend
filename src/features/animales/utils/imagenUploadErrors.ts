import { normalizeBackendDetail } from "@/features/auth";
import { ApiError } from "@/services/httpClient";

const MENSAJE_LOTE_CANCELADO =
  " Como subiste varias fotos juntas, no se guardó ninguna: el rechazo de una cancela el lote completo.";

/**
 * Traduce el error de POST /evaluaciones-cc/{id}/imagenes a un mensaje para el
 * usuario. 400 y 502 tienen mensajes propios porque el backend no distingue
 * ahí "imagen sin vaca" de "servicio de IA caído" con el mismo detail para
 * todos los casos; el resto de los status ya vienen con un detail claro.
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
      mensaje =
        "No pudimos confirmar que la imagen contenga un bovino. Probá con otra foto, más cerca y con buena luz.";
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
