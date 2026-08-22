import { Button } from "@chakra-ui/react";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import type { EvaluacionCC } from "@/features/animales/types";
import { getAnimalRfidLabel } from "@/features/animales/utils/animalRfid";
import { formatEventDateTime } from "@/utils/localDateTime";

type SesionEvaluacionRowProps = {
  evaluacion: EvaluacionCC;
  onEdit: () => void;
  onDelete: () => void;
};

export function SesionEvaluacionRow({ evaluacion, onEdit, onDelete }: SesionEvaluacionRowProps) {
  const tituloId = `evaluacion-${evaluacion.id}-titulo`;
  const animalRfid = getAnimalRfidLabel(evaluacion.animal_rfid);
  const animalAccessibleName =
    animalRfid === "Sin RFID"
      ? "animal sin RFID"
      : `animal con RFID ${animalRfid}`;

  return (
    <article className="sesion-evaluacion" aria-labelledby={tituloId}>
      <div className="sesion-evaluacion__heading">
        <div>
          <span className="sesion-evaluacion__eyebrow">Animal</span>
          <h2 id={tituloId}>{animalRfid}</h2>
        </div>
        <div className="sesion-evaluacion__actions">
          <strong className="sesion-evaluacion__valor" aria-label={`Condición corporal ${evaluacion.valor_cc}`}>
            CC {evaluacion.valor_cc}
          </strong>
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
            aria-label={`Editar evaluación del ${animalAccessibleName}`}>
            <IconPencil size={16} stroke={1.5} />
            Editar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            colorPalette="red"
            onClick={onDelete}
            aria-label={`Eliminar evaluación del ${animalAccessibleName}`}>
            <IconTrash size={16} stroke={1.5} />
            Eliminar
          </Button>
        </div>
      </div>

      <dl className="sesion-evaluacion__datos">
        <div>
          <dt>Escala</dt>
          <dd>
            {evaluacion.escala_min}–{evaluacion.escala_max}
          </dd>
        </div>
        <div>
          <dt>Evaluada</dt>
          <dd>{formatEventDateTime(evaluacion.fecha)}</dd>
        </div>
      </dl>

      <div className="sesion-evaluacion__observaciones">
        <span>Observaciones</span>
        <p>{evaluacion.observaciones || "Sin observaciones."}</p>
      </div>
    </article>
  );
}
