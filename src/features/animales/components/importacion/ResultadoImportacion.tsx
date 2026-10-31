import { Button } from "@chakra-ui/react";
import { IconAlertTriangle, IconCircleCheckFilled, IconDownload, IconUpload } from "@tabler/icons-react";
import type { ResultadoImportacion as Resultado } from "@/features/animales/types/importacion";

type Props = {
  resultado: Resultado;
  /** Filas que no se cargaron: las rechazadas al confirmar más las que ya tenían errores. */
  noCargadas: number;
  descargando: boolean;
  onDescargarErrores: () => void;
  onSubirCorregido: () => void;
  onTerminar: () => void;
};

export function ResultadoImportacion({
  resultado,
  noCargadas,
  descargando,
  onDescargarErrores,
  onSubirCorregido,
  onTerminar,
}: Props) {
  const cargados = resultado.creados + resultado.actualizados + resultado.reactivados;
  const exito = noCargadas === 0;

  return (
    <section
      className={`importar__resultado importar__resultado--${exito ? "exito" : "parcial"}`}
      aria-live="polite">
      <span className="importar__resultado-icono" aria-hidden="true">
        {exito ? <IconCircleCheckFilled size={40} /> : <IconAlertTriangle size={36} stroke={1.75} />}
      </span>
      <div className="importar__resultado-texto">
        <h2>
          {exito
            ? "¡Listo! Importamos todos los animales"
            : `Importamos ${cargados} ${cargados === 1 ? "animal" : "animales"}, pero ${noCargadas} ${
                noCargadas === 1 ? "fila no se pudo cargar" : "filas no se pudieron cargar"
              }`}
        </h2>
        <ul>
          {resultado.creados > 0 && (
            <li>
              {resultado.creados} {resultado.creados === 1 ? "alta nueva" : "altas nuevas"}
            </li>
          )}
          {resultado.actualizados > 0 && (
            <li>
              {resultado.actualizados}{" "}
              {resultado.actualizados === 1 ? "animal actualizado" : "animales actualizados"}
            </li>
          )}
          {resultado.reactivados > 0 && (
            <li>
              {resultado.reactivados}{" "}
              {resultado.reactivados === 1 ? "animal reactivado" : "animales reactivados"}
            </li>
          )}
          {resultado.lotes_creados.length > 0 && (
            <li>Lotes creados: {resultado.lotes_creados.join(", ")}</li>
          )}
          {resultado.lotes_reactivados.length > 0 && (
            <li>Lotes reactivados: {resultado.lotes_reactivados.join(", ")}</li>
          )}
        </ul>
        {!exito && (
          <p>
            Descargá el Excel con los errores: tiene esas filas tal como las cargaste, con el dato a
            corregir marcado en rojo y el motivo en la columna "Error". Corregilo y volvé a subirlo.
          </p>
        )}
      </div>
      <div className="importar__resultado-acciones">
        {!exito && (
          <>
            <Button
              colorPalette="brand"
              onClick={onDescargarErrores}
              loading={descargando}
              loadingText="Generando...">
              <IconDownload size={18} stroke={1.75} />
              Descargar Excel con errores
            </Button>
            <Button variant="outline" onClick={onSubirCorregido}>
              <IconUpload size={18} stroke={1.75} />
              Subir archivo corregido
            </Button>
          </>
        )}
        <Button variant={exito ? "solid" : "ghost"} colorPalette="brand" onClick={onTerminar}>
          {exito ? "Ir al rodeo" : "Terminar"}
        </Button>
      </div>
    </section>
  );
}
