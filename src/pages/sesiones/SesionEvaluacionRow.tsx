import { Button } from "@chakra-ui/react";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import type { EvaluacionCC } from "@/features/animales/types";

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

type SesionEvaluacionRowProps = {
  evaluacion: EvaluacionCC;
  onEdit: () => void;
  onDelete: () => void;
};

export function SesionEvaluacionRow({ evaluacion, onEdit, onDelete }: SesionEvaluacionRowProps) {
  const tituloId = `evaluacion-${evaluacion.id}-titulo`;

  return (
    <article className="sesion-evaluacion" aria-labelledby={tituloId}>
      <div className="sesion-evaluacion__heading">
        <div>
          <span className="sesion-evaluacion__eyebrow">Animal</span>
          <h2 id={tituloId}>#{evaluacion.animal_id}</h2>
        </div>
        <div className="sesion-evaluacion__actions">
          <strong className="sesion-evaluacion__valor" aria-label={`Condición corporal ${evaluacion.valor_cc}`}>
            CC {evaluacion.valor_cc}
          </strong>
          <Button size="sm" variant="ghost" onClick={onEdit} aria-label={`Editar evaluación del animal ${evaluacion.animal_id}`}>
            <IconPencil size={16} stroke={1.5} />
            Editar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            colorPalette="red"
            onClick={onDelete}
            aria-label={`Eliminar evaluación del animal ${evaluacion.animal_id}`}>
            <IconTrash size={16} stroke={1.5} />
            Eliminar
          </Button>
        </div>
      </div>

      <dl className="sesion-evaluacion__datos">
        <div>
          <dt>Estado</dt>
          <dd>{evaluacion.estado}</dd>
        </div>
        <div>
          <dt>Escala</dt>
          <dd>
            {evaluacion.escala_min}–{evaluacion.escala_max}
          </dd>
        </div>
        <div>
          <dt>Evaluada</dt>
          <dd>{DATE_TIME_FORMATTER.format(new Date(evaluacion.fecha))}</dd>
        </div>
      </dl>

      <div className="sesion-evaluacion__observaciones">
        <span>Observaciones</span>
        <p>{evaluacion.observaciones || "Sin observaciones."}</p>
      </div>
    </article>
  );
}
