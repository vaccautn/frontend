import { useState } from "react";
import { IconAlertCircle, IconCircleCheck, IconHelpCircle, IconSparkles } from "@tabler/icons-react";
import { CATEGORIA_ANIMAL_LABELS } from "@/features/animales/constants";
import type {
  CampoImportacion,
  EstadoFilaImportacion,
  FilaAnalizada,
} from "@/features/animales/types/importacion";
import { COLUMNAS_IMPORTACION } from "@/features/animales/utils/importacionAnimales";
import { formatFecha } from "@/features/animales/utils/formatDate";

/** Más filas que esto no se dibujan de una: se usan los filtros. */
const MAXIMO_FILAS = 500;

type Filtro = "todas" | EstadoFilaImportacion;

const FILTROS: { valor: Filtro; etiqueta: string }[] = [
  { valor: "todas", etiqueta: "Todas" },
  { valor: "CONSULTA", etiqueta: "Requieren tu decisión" },
  { valor: "INFERIDA", etiqueta: "Interpretadas" },
  { valor: "ERROR", etiqueta: "Con errores" },
];

const ESTADOS: Record<EstadoFilaImportacion, { etiqueta: string; icono: typeof IconCircleCheck }> = {
  LISTA: { etiqueta: "Lista", icono: IconCircleCheck },
  INFERIDA: { etiqueta: "Lista", icono: IconSparkles },
  CONSULTA: { etiqueta: "Requiere tu decisión", icono: IconHelpCircle },
  ERROR: { etiqueta: "Con errores", icono: IconAlertCircle },
};

function mostrarValor(fila: FilaAnalizada, campo: CampoImportacion): string {
  const valor = fila.valores[campo];
  if (!valor) return "";
  if (campo === "fecha_nacimiento") return formatFecha(valor);
  if (campo === "categoria") return CATEGORIA_ANIMAL_LABELS[valor] ?? valor;
  if (campo === "origen") return valor === "SERVICIO" ? "Servicio" : valor === "COMPRA" ? "Compra" : valor;
  return valor;
}

export function TablaRevision({ filas }: { filas: FilaAnalizada[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const filtradas = filtro === "todas" ? filas : filas.filter((fila) => fila.estado === filtro);
  const visibles = filtradas.slice(0, MAXIMO_FILAS);

  return (
    <div className="importar__tabla-card">
      <div className="importar__tabla-header">
        <h2>Vista previa</h2>
        <div className="importar__filtros" role="group" aria-label="Filtrar filas">
          {FILTROS.map(({ valor, etiqueta }) => {
            const cantidad = valor === "todas" ? filas.length : filas.filter((f) => f.estado === valor).length;
            if (valor !== "todas" && cantidad === 0) return null;
            return (
              <button
                key={valor}
                type="button"
                aria-pressed={filtro === valor}
                className="importar__filtro"
                onClick={() => setFiltro(valor)}>
                {etiqueta} <span>{cantidad}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="importar__tabla-scroll">
        <table className="animales-table importar__tabla">
          <thead>
            <tr>
              <th>Fila</th>
              {COLUMNAS_IMPORTACION.map((columna) => (
                <th key={columna.clave}>{columna.titulo}</th>
              ))}
              <th>Sexo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((fila) => {
              const { etiqueta, icono: Icono } = ESTADOS[fila.estado];
              const camposConError = new Set(fila.errores.map((e) => e.campo));
              return (
                <tr key={fila.numero} data-estado={fila.estado}>
                  <td className="importar__fila-numero">{fila.numero}</td>
                  {COLUMNAS_IMPORTACION.map(({ clave }) => {
                    const inferencia = fila.inferencias.find((i) => i.campo === clave);
                    const valor = mostrarValor(fila, clave);
                    return (
                      <td key={clave} data-error={camposConError.has(clave) || undefined}>
                        {valor || <span className="importar__vacio">—</span>}
                        {inferencia && (
                          <small className="importar__inferencia" title="Valor escrito en el archivo">
                            escrito «{inferencia.original}»
                          </small>
                        )}
                      </td>
                    );
                  })}
                  <td>
                    {fila.sexo === "HEMBRA" ? "Hembra" : fila.sexo === "MACHO" ? "Macho" : (
                      <span className="importar__vacio">—</span>
                    )}
                  </td>
                  <td>
                    <span className={`importar__estado importar__estado--${fila.estado.toLowerCase()}`}>
                      <Icono size={14} stroke={2} />
                      {etiqueta}
                    </span>
                    {fila.errores.length > 0 && (
                      <ul className="importar__errores">
                        {fila.errores.map((error) => (
                          <li key={error.mensaje}>{error.mensaje}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filtradas.length > MAXIMO_FILAS && (
        <p className="importar__tabla-pie">
          Mostrando {MAXIMO_FILAS} de {filtradas.length} filas. Usá los filtros para ver las que
          necesitan atención.
        </p>
      )}
    </div>
  );
}
