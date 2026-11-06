import type { EvaluacionCC } from "@/features/animales/types";
import { EvaluacionFoto } from "@/features/animales/components/EvaluacionFoto";
import { getAnimalRfidLabel } from "@/features/animales/utils/animalRfid";
import { nivelCC } from "@/features/animales/utils/ccColor";

type Props = {
  titulo: string;
  evaluaciones: EvaluacionCC[];
  onEdit: (evaluacion: EvaluacionCC) => void;
};

/** Evaluaciones de la sesión como tarjetas: foto, CC, caravana y
 * observaciones. Clickear una abre la edición. */
export function SesionEvaluacionesCards({ titulo, evaluaciones, onEdit }: Props) {
  return (
    <section className="sesion-seccion">
      <div className="sesion-seccion__titulo">
        <h2>{titulo}</h2>
        <span>
          {evaluaciones.length === 1
            ? "1 animal"
            : `${evaluaciones.length} animales`}
        </span>
      </div>
      <ul className="sesion-tarjetas">
        {evaluaciones.map((evaluacion) => {
          const nivel =
            evaluacion.valor_cc === null
              ? "pendiente"
              : nivelCC(evaluacion.valor_cc, evaluacion.fecha);
          const caravana = getAnimalRfidLabel(evaluacion.animal_rfid);
          return (
            <li key={evaluacion.id}>
              <button
                type="button"
                className={`sesion-tarjeta sesion-tarjeta--compacta sesion-tarjeta--boton sesion-tarjeta--${nivel}`}
                aria-label={`Editar la evaluación de ${caravana}`}
                onClick={() => onEdit(evaluacion)}>
                <div className="sesion-tarjeta__media">
                  <EvaluacionFoto evaluacionId={evaluacion.id} caravana={caravana} />
                  <span className={`sesion-tarjeta__cc sesion-tarjeta__cc--${nivel}`}>
                    {evaluacion.valor_cc === null
                      ? "Pendiente de CC"
                      : evaluacion.valor_cc}
                  </span>
                </div>
                <div className="sesion-tarjeta__cuerpo">
                  <strong className="sesion-tarjeta__caravana">{caravana}</strong>
                  <span className="sesion-tarjeta__sub">
                    {evaluacion.observaciones || "Sin observaciones"}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
