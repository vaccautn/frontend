import { NativeSelect } from "@chakra-ui/react";
import {
  IconArrowBackUp,
  IconCalendarQuestion,
  IconCopy,
  IconForms,
  IconHelpCircle,
  IconRefresh,
  IconStack2,
} from "@tabler/icons-react";
import {
  CATEGORIA_ANIMAL_LABELS,
  CATEGORIAS_ANIMAL,
  ESTADO_ANIMAL_LABELS,
} from "@/features/animales/constants";
import { SelectOpciones } from "@/components/SelectOpciones";
import {
  OPCION,
  type ConsultaImportacion,
  type FilaAnalizada,
  type TipoConsulta,
} from "@/features/animales/types/importacion";
import {
  admiteDecisionPorFila,
  opcionDeFila,
  type Decision,
} from "@/features/animales/utils/importacionAnimales";
import { formatFecha } from "@/features/animales/utils/formatDate";

const ICONOS: Record<TipoConsulta, typeof IconHelpCircle> = {
  VALOR_DUDOSO: IconHelpCircle,
  CAMPO_VACIO: IconForms,
  ORIGEN_SERVICIO: IconCalendarQuestion,
  LOTE_NUEVO: IconStack2,
  LOTE_INACTIVO: IconStack2,
  CARAVANA_REPETIDA: IconCopy,
  CARAVANA_REGISTRADA: IconRefresh,
  CARAVANA_DADA_DE_BAJA: IconArrowBackUp,
};

/** Con más opciones que esto se usa un desplegable en vez de botones. */
const MAXIMO_BOTONES = 5;

type Props = {
  consulta: ConsultaImportacion;
  decision: Decision | undefined;
  filas: Map<number, FilaAnalizada>;
  onCambiar: (decision: Decision) => void;
};

function listarFilas(numeros: number[]): string {
  const visibles = numeros.slice(0, 6).join(", ");
  return numeros.length > 6 ? `${visibles} y ${numeros.length - 6} más` : visibles;
}

export function ConsultaCard({ consulta, decision, filas, onCambiar }: Props) {
  const Icono = ICONOS[consulta.tipo];
  const pendientes = consulta.filas.filter((numero) => !opcionDeFila(decision, numero)).length;
  const conDesplegable = consulta.opciones.length > MAXIMO_BOTONES;
  const elegir = (opcion: string) => onCambiar({ ...decision, opcion });

  return (
    <article
      className="consulta"
      data-estado={pendientes === 0 ? "decidida" : "pendiente"}
      aria-labelledby={`consulta-${consulta.clave}`}>
      <header className="consulta__header">
        <span className="consulta__icono" aria-hidden="true">
          <Icono size={20} stroke={1.75} />
        </span>
        <div className="consulta__texto">
          <p id={`consulta-${consulta.clave}`} className="consulta__mensaje">
            {consulta.mensaje}
          </p>
          <span className="consulta__filas">
            {consulta.filas.length === 1 ? "Fila" : `${consulta.filas.length} filas:`}{" "}
            {listarFilas(consulta.filas)}
          </span>
        </div>
        <span className="consulta__estado">{pendientes === 0 ? "Decidido" : "Pendiente"}</span>
      </header>

      {consulta.animal_existente && (
        <ComparacionAnimal consulta={consulta} fila={filas.get(consulta.filas[0])} />
      )}

      {conDesplegable ? (
        <div className="consulta__desplegable">
          <SelectOpciones
            aria-label={consulta.mensaje}
            placeholder="Elegí una opción"
            opciones={consulta.opciones.map((o) => ({ value: o.valor, label: o.etiqueta }))}
            value={decision?.opcion ?? ""}
            onChange={elegir}
          />
        </div>
      ) : (
        <div className="consulta__opciones" role="radiogroup" aria-label={consulta.mensaje}>
          {consulta.opciones.map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              role="radio"
              aria-checked={decision?.opcion === opcion.valor}
              data-tono={opcion.valor === OPCION.NO_IMPORTAR ? "neutro" : undefined}
              className="consulta__opcion"
              onClick={() => elegir(opcion.valor)}>
              {opcion.etiqueta}
            </button>
          ))}
        </div>
      )}

      {consulta.tipo === "LOTE_NUEVO" && decision?.opcion === OPCION.CREAR_LOTE && (
        <label className="consulta__extra">
          <span>Categoría del lote «{consulta.valor}»</span>
          <NativeSelect.Root size="sm">
            <NativeSelect.Field
              value={decision.categoriaLote ?? ""}
              onChange={(event) => onCambiar({ ...decision, categoriaLote: event.target.value })}>
              <option value="">No sé: usar la más frecuente entre sus animales</option>
              {CATEGORIAS_ANIMAL.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </label>
      )}

      {admiteDecisionPorFila(consulta) && (
        <details className="consulta__por-fila">
          <summary>Decidir fila por fila</summary>
          <ul>
            {consulta.filas.map((numero) => (
              <li key={numero}>
                <span>
                  Fila {numero}
                  <small>{filas.get(numero)?.valores.caravana}</small>
                </span>
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field
                    aria-label={`Opción para la fila ${numero}`}
                    value={decision?.porFila?.[numero] ?? ""}
                    onChange={(event) => {
                      const porFila = { ...decision?.porFila };
                      if (event.target.value) porFila[numero] = event.target.value;
                      else delete porFila[numero];
                      onCambiar({ ...decision, porFila });
                    }}>
                    <option value="">Igual que el resto</option>
                    {consulta.opciones.map((opcion) => (
                      <option key={opcion.valor} value={opcion.valor}>
                        {opcion.etiqueta}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}

function ComparacionAnimal({
  consulta,
  fila,
}: {
  consulta: ConsultaImportacion;
  fila: FilaAnalizada | undefined;
}) {
  const actual = consulta.animal_existente!;
  const archivo = fila?.valores;
  const filasComparacion = [
    {
      campo: "Estado",
      actual: ESTADO_ANIMAL_LABELS[actual.estado] ?? actual.estado,
      nuevo: consulta.tipo === "CARAVANA_DADA_DE_BAJA" ? ESTADO_ANIMAL_LABELS.ACTIVO : "",
    },
    {
      campo: "Categoría",
      actual: CATEGORIA_ANIMAL_LABELS[actual.categoria] ?? actual.categoria,
      nuevo: archivo?.categoria ? (CATEGORIA_ANIMAL_LABELS[archivo.categoria] ?? archivo.categoria) : "",
    },
    { campo: "Lote", actual: actual.lote ?? "—", nuevo: archivo?.lote ?? "" },
    { campo: "Raza", actual: actual.raza || "—", nuevo: archivo?.raza ?? "" },
    {
      campo: "Nacimiento",
      actual: actual.fecha_nacimiento ? formatFecha(actual.fecha_nacimiento) : "—",
      nuevo: archivo?.fecha_nacimiento ? formatFecha(archivo.fecha_nacimiento) : "",
    },
    {
      campo: "Origen",
      actual: actual.origen === "SERVICIO" ? "Servicio" : "Compra",
      nuevo: archivo?.origen ? (archivo.origen === "SERVICIO" ? "Servicio" : "Compra") : "",
    },
  ];

  return (
    <table className="consulta__comparacion">
      <thead>
        <tr>
          <th scope="col">Dato</th>
          <th scope="col">En tu rodeo</th>
          <th scope="col">En el archivo</th>
        </tr>
      </thead>
      <tbody>
        {filasComparacion.map((f) => (
          <tr key={f.campo} data-cambia={f.nuevo && f.nuevo !== f.actual ? true : undefined}>
            <th scope="row">{f.campo}</th>
            <td>{f.actual}</td>
            <td>{f.nuevo || <span className="importar__vacio">Se conserva</span>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
