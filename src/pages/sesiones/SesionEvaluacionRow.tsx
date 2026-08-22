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
  const animalRfid = getAnimalRfidLabel(evaluacion.animal_rfid);
  const animalAccessibleName =
    animalRfid === "Sin RFID" ? "animal sin RFID" : `animal con RFID ${animalRfid}`;

  return (
    <tr className="sesion-evaluacion-row">
      <td className="sesion-evaluacion-row__animal">{animalRfid}</td>
      <td>
        <span
          className={`sesion-evaluacion-row__badge sesion-evaluacion-row__badge--cc-${evaluacion.valor_cc}`}
          aria-label={`Condición corporal ${evaluacion.valor_cc}`}>
          CC {evaluacion.valor_cc}
        </span>
      </td>
      <td className="sesion-evaluacion-row__observaciones">
        {evaluacion.observaciones?.trim() || "Sin observaciones."}
      </td>
      <td className="sesion-evaluacion-row__hora">{formatEventDateTime(evaluacion.fecha)}</td>
      <td className="sesion-evaluacion-row__acciones">
        <button
          type="button"
          className="sesion-evaluacion-row__action"
          onClick={onEdit}
          aria-label={`Editar evaluación del ${animalAccessibleName}`}>
          <IconPencil size={16} stroke={1.5} />
        </button>
        <button
          type="button"
          className="sesion-evaluacion-row__action sesion-evaluacion-row__action--danger"
          onClick={onDelete}
          aria-label={`Eliminar evaluación del ${animalAccessibleName}`}>
          <IconTrash size={16} stroke={1.5} />
        </button>
      </td>
    </tr>
  );
}
