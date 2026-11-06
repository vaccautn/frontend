import { useState } from "react";
import { IconCircleCheck } from "@tabler/icons-react";

const PASOS = [
  {
    titulo: "Prepará la planilla",
    texto:
      "Subí una planilla con tus animales y los damos de alta en un solo paso. Antes de importar vas a poder revisar cada fila.",
  },
  {
    titulo: "Subí el archivo",
    texto:
      "Arrastrá tu planilla o elegila desde tu compu o celular. Aceptamos CSV y Excel (.xlsx) de hasta 5 MB. Si tu Excel tiene varias hojas, buscamos la que tenga las columnas pedidas.",
  },
  {
    titulo: "Revisá e importá",
    texto:
      "Te mostramos cómo interpretamos cada fila. Confirmá las dudas que marcamos e importá los animales listos. Si alguno no se puede cargar, descargá el Excel con los errores marcados, corregilo y volvé a subirlo.",
  },
] as const;

type Props = {
  /** Paso en el que está el usuario según su avance (0 a 2). */
  pasoActual: number;
};

/** Pasos del asistente. Tocar un paso muestra su explicación; el avance real
 * lo marca `pasoActual`, y al avanzar la explicación lo acompaña. */
export function PasosImportacion({ pasoActual }: Props) {
  const [visto, setVisto] = useState(pasoActual);
  const [pasoPrevio, setPasoPrevio] = useState(pasoActual);
  if (pasoActual !== pasoPrevio) {
    setPasoPrevio(pasoActual);
    setVisto(pasoActual);
  }

  return (
    <div className="importar__pasos-bloque">
      {/* key: al cambiar de paso el texto se vuelve a montar y se anima. */}
      <p
        key={visto}
        id="importar-paso-texto"
        role="tabpanel"
        aria-labelledby={`importar-paso-${visto}`}
        className="importar__paso-texto">
        {PASOS[visto].texto}
      </p>
      <div className="importar__pasos" role="tablist" aria-label="Pasos de la importación">
        {PASOS.map((paso, i) => (
          <button
            key={paso.titulo}
            id={`importar-paso-${i}`}
            type="button"
            role="tab"
            aria-selected={i === visto}
            aria-controls="importar-paso-texto"
            data-estado={i < pasoActual ? "hecho" : i === pasoActual ? "actual" : "pendiente"}
            data-visto={i === visto || undefined}
            className="importar__paso"
            onClick={() => setVisto(i)}>
            <span className="importar__paso-numero">
              {i < pasoActual ? <IconCircleCheck size={18} stroke={2} /> : i + 1}
            </span>
            {paso.titulo}
          </button>
        ))}
      </div>
    </div>
  );
}
