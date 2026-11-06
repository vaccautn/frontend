import { Button } from "@chakra-ui/react";
import {
  IconCalendarEvent,
  IconCategory,
  IconDna,
  IconDownload,
  IconInfoCircle,
  IconShoppingCart,
  IconStack2,
  IconTag,
} from "@tabler/icons-react";
import { CATEGORIA_ANIMAL_LABELS, CATEGORIAS_POR_SEXO, RAZAS } from "@/features/animales/constants";
import type { CampoImportacion } from "@/features/animales/types/importacion";
import type { LoteOption } from "@/features/lotes/types";
import { COLUMNAS_IMPORTACION, descargarPlantilla } from "@/features/animales/utils/importacionAnimales";

// Cada columna con su ícono; el color sale de data-columna en el CSS.
const ICONOS_COLUMNA: Record<CampoImportacion, typeof IconTag> = {
  caravana: IconTag,
  categoria: IconCategory,
  lote: IconStack2,
  origen: IconShoppingCart,
  fecha_nacimiento: IconCalendarEvent,
  raza: IconDna,
};

type Props = {
  lotes: LoteOption[];
  lotesError: boolean;
};

export function FormatoArchivo({ lotes, lotesError }: Props) {
  const activos = lotes.filter((lote) => lote.activo);
  const inactivos = lotes.filter((lote) => !lote.activo);

  return (
    <section className="importar__formato" aria-labelledby="importar-formato-titulo">
      <div className="importar__formato-header">
        <div>
          <h2 id="importar-formato-titulo">Formato del archivo</h2>
          <p className="importar__ayuda">
            Una fila por animal y los nombres de las columnas en la primera fila. El orden de las
            columnas no importa. El sexo no hace falta: lo sacamos de la categoría.
          </p>
        </div>
        <div className="importar__formato-acciones">
          <Button variant="outline" className="importar__plantilla" onClick={descargarPlantilla}>
            <IconDownload size={18} stroke={1.75} />
            Descargar plantilla
          </Button>
          <span className="importar__nota">CSV con ";" o "," · Excel .xlsx · hasta 5 MB</span>
        </div>
      </div>

      <ul className="importar__columnas">
        {COLUMNAS_IMPORTACION.map((columna) => {
          const Icono = ICONOS_COLUMNA[columna.clave];
          return (
            <li key={columna.clave} data-columna={columna.clave}>
              <span className="importar__columna-cabecera">
                <span className="importar__columna-icono" aria-hidden="true">
                  <Icono size={18} stroke={1.75} />
                </span>
                <span
                  className={`importar__requerida importar__requerida--${columna.obligatoria ? "si" : "no"}`}>
                  {columna.obligatoria ? "Obligatoria" : "Opcional"}
                </span>
              </span>
              <span className="importar__columna-titulo">{columna.titulo}</span>
              <code>{columna.clave}</code>
              <span className="importar__columna-formato">{columna.formato}</span>
              <span className="importar__columna-ejemplo">Ej.: {columna.ejemplo}</span>
            </li>
          );
        })}
      </ul>

      <div className="importar__notas">
        <p>
          <IconInfoCircle size={18} stroke={1.75} aria-hidden="true" />
          <span>
            <strong>Caravana:</strong> es la identificación oficial de SENASA y acompaña al animal
            de por vida. Da igual si la escribís en mayúsculas o minúsculas. Si ya es de un animal
            activo de tu rodeo, te preguntamos si querés actualizarlo; si es de uno que diste de
            baja, si volvió y querés reactivarlo. Que la tenga otro productor (por ejemplo, quien te
            lo vendió) no es problema.
          </span>
        </p>
        <p>
          <IconInfoCircle size={18} stroke={1.75} aria-hidden="true" />
          <span>
            <strong>Opcionales vacías:</strong> si falta la raza, la fecha o el origen, te
            preguntamos si querés cargar el animal igual. Sin origen se registra como compra.
          </span>
        </p>
      </div>

      <div className="importar__desplegables">
        <details className="importar__categorias">
          <summary>Ver categorías aceptadas</summary>
          <div className="importar__categorias-cuerpo">
            {(["HEMBRA", "MACHO"] as const).map((sexo) => (
              <div key={sexo} className="importar__categorias-grupo">
                <span>{sexo === "HEMBRA" ? "Hembras" : "Machos"}</span>
                <div>
                  {CATEGORIAS_POR_SEXO[sexo].map((valor) => (
                    <code key={valor}>{CATEGORIA_ANIMAL_LABELS[valor]}</code>
                  ))}
                </div>
              </div>
            ))}
            <p className="importar__ayuda">
              Da igual cómo la separes: "vaca seca", "vaca_seca" y "VACA-SECA" son lo mismo. Si
              hay un error de tipeo chico, lo corregimos y te lo mostramos.
            </p>
          </div>
        </details>

        <details className="importar__categorias">
          <summary>Ver razas aceptadas</summary>
          <div className="importar__categorias-cuerpo">
            <div className="importar__categorias-grupo">
              <div>
                {RAZAS.map((raza) => (
                  <code key={raza}>{raza}</code>
                ))}
              </div>
            </div>
            <p className="importar__ayuda">
              Si tu raza no está en la lista, te preguntamos si querés registrarla como "Otro".
            </p>
          </div>
        </details>

        <details className="importar__categorias">
          <summary>Ver tus lotes</summary>
          <div className="importar__categorias-cuerpo">
            {lotesError ? (
              <p className="importar__ayuda">No pudimos cargar tus lotes.</p>
            ) : lotes.length === 0 ? (
              <p className="importar__ayuda">Todavía no tenés lotes.</p>
            ) : (
              <>
                {activos.length > 0 && (
                  <div className="importar__categorias-grupo">
                    <span>Activos</span>
                    <div>
                      {activos.map((lote) => (
                        <code key={lote.id}>{lote.nombre}</code>
                      ))}
                    </div>
                  </div>
                )}
                {inactivos.length > 0 && (
                  <div className="importar__categorias-grupo">
                    <span>Inactivos</span>
                    <div>
                      {inactivos.map((lote) => (
                        <code key={lote.id} className="importar__lote-inactivo">
                          {lote.nombre}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            <p className="importar__ayuda">
              Si en el archivo aparece un lote que no está en esta lista, te vamos a preguntar si
              es un lote nuevo (y lo creamos con ese nombre) o si te equivocaste de nombre. Si es un
              lote inactivo, te preguntamos si querés reactivarlo.
            </p>
          </div>
        </details>
      </div>
    </section>
  );
}
