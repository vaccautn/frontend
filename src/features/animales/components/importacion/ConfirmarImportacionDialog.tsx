import { Button, Dialog, Portal } from "@chakra-ui/react";
import type { Confirmacion } from "@/features/animales/utils/importacionAnimales";

type Props = {
  open: boolean;
  confirmacion: Confirmacion;
  filasConError: number;
  onCancelar: () => void;
  onConfirmar: () => void;
};

function plural(cantidad: number, singular: string, varios: string) {
  return `${cantidad} ${cantidad === 1 ? singular : varios}`;
}

export function ConfirmarImportacionDialog({
  open,
  confirmacion,
  filasConError,
  onCancelar,
  onConfirmar,
}: Props) {
  const { payload, descartadas, sinResolver, actualizaciones, reactivaciones } = confirmacion;
  const aImportar = payload.filas.length - sinResolver.length;
  const nuevos = aImportar - actualizaciones - reactivaciones;
  const noSeImportan = sinResolver.length + filasConError;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) onCancelar();
      }}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>¿Importamos los animales?</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <ul className="importar__confirmar-lista">
                {nuevos > 0 && <li>Se dan de alta {plural(nuevos, "animal nuevo", "animales nuevos")}.</li>}
                {actualizaciones > 0 && (
                  <li>Se actualizan {plural(actualizaciones, "animal", "animales")} que ya estaban en tu rodeo.</li>
                )}
                {reactivaciones > 0 && (
                  <li>
                    Se reactivan {plural(reactivaciones, "animal", "animales")} que habían sido dados de baja y
                    volvieron a tu rodeo.
                  </li>
                )}
                {payload.lotes_nuevos.length > 0 && (
                  <li>
                    Se crean los lotes: {payload.lotes_nuevos.map((lote) => `«${lote.nombre}»`).join(", ")}.
                  </li>
                )}
                {payload.lotes_reactivar.length > 0 && (
                  <li>Se reactivan {plural(payload.lotes_reactivar.length, "lote", "lotes")}.</li>
                )}
                {descartadas.length > 0 && (
                  <li>Se descartan {plural(descartadas.length, "fila repetida", "filas repetidas")}.</li>
                )}
                {noSeImportan > 0 && (
                  <li className="importar__confirmar-aviso">
                    {plural(noSeImportan, "fila no se importa", "filas no se importan")} (con errores o
                    sin decidir). Al terminar vas a poder descargarlas en un Excel para corregirlas.
                  </li>
                )}
              </ul>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" onClick={onCancelar}>
                Volver a revisar
              </Button>
              <Button colorPalette="brand" onClick={onConfirmar} disabled={aImportar <= 0}>
                Importar {plural(aImportar, "animal", "animales")}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
