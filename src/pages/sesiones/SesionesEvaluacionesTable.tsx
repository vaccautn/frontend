import { Table } from "@chakra-ui/react";
import type { EvaluacionCC } from "@/features/animales/types";
import { getAnimalRfidLabel } from "@/features/animales/utils/animalRfid";
import { formatEventDateTime } from "@/utils/localDateTime";

type SesionEvaluacionesTableProps = {
  evaluaciones: EvaluacionCC[];
  onRowClick: (evaluacion: EvaluacionCC) => void;
};

export function SesionEvaluacionesTable({
  evaluaciones,
  onRowClick,
}: SesionEvaluacionesTableProps) {
  return (
    <div className="sesion-evaluaciones-table__wrapper">
      <Table.Root className="animales-table" interactive>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Animal</Table.ColumnHeader>
            <Table.ColumnHeader>CC</Table.ColumnHeader>
            <Table.ColumnHeader>Escala</Table.ColumnHeader>
            <Table.ColumnHeader>Evaluada</Table.ColumnHeader>
            <Table.ColumnHeader>Observaciones</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {evaluaciones.map((evaluacion) => {
            const animalRfid = getAnimalRfidLabel(evaluacion.animal_rfid);
            const animalAccessibleName =
              animalRfid === "Sin RFID"
                ? "animal sin RFID"
                : `animal con RFID ${animalRfid}`;

            return (
              <Table.Row
                key={evaluacion.id}
                className="animales-table__row"
                tabIndex={0}
                role="button"
                aria-label={`Editar evaluación del ${animalAccessibleName}`}
                onClick={() => onRowClick(evaluacion)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onRowClick(evaluacion);
                  }
                }}>
                <Table.Cell>{animalRfid}</Table.Cell>
                <Table.Cell>
                  <strong
                    className="sesion-evaluaciones-table__cc"
                    aria-label={`Condición corporal ${evaluacion.valor_cc}`}>
                    CC {evaluacion.valor_cc}
                  </strong>
                </Table.Cell>
                <Table.Cell>
                  {evaluacion.escala_min}–{evaluacion.escala_max}
                </Table.Cell>
                <Table.Cell>{formatEventDateTime(evaluacion.fecha)}</Table.Cell>
                <Table.Cell className="sesion-evaluaciones-table__observaciones">
                  {evaluacion.observaciones || "Sin observaciones."}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </div>
  );
}
