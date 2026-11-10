import { getAccessToken } from "@/features/auth";
import { postFormData, postJson, postJsonBlob } from "@/services/httpClient";
import type {
  AnalisisImportacion,
  ArchivoErroresPayload,
  ConfirmarImportacionPayload,
  ResultadoImportacion,
} from "@/features/animales/types/importacion";

/** Fase 1: el backend lee la planilla y devuelve qué entendió de cada fila,
 * sin guardar nada. */
export function analizarPlanilla(archivo: File): Promise<AnalisisImportacion> {
  const formData = new FormData();
  formData.append("archivo", archivo);
  return postFormData<AnalisisImportacion>(
    "/animales/importacion/analizar",
    formData,
    getAccessToken(),
  );
}

/** Fase 2: el backend vuelve a validar todo y guarda las filas válidas. */
export function confirmarImportacion(
  payload: ConfirmarImportacionPayload,
): Promise<ResultadoImportacion> {
  return postJson<ResultadoImportacion, ConfirmarImportacionPayload>(
    "/animales/importacion/confirmar",
    payload,
    getAccessToken(),
  );
}

export async function descargarArchivoErrores(
  payload: ArchivoErroresPayload,
): Promise<void> {
  const blob = await postJsonBlob(
    "/animales/importacion/archivo-errores",
    payload,
    getAccessToken(),
  );
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "animales-con-errores.xlsx";
  enlace.click();
  URL.revokeObjectURL(url);
}
