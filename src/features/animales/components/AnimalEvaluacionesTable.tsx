import { Table } from "@chakra-ui/react";
import type { EvaluacionCC } from "@/features/animales/types";
import { formatFechaDeTimestamp } from "@/features/animales/utils/formatDate";

type AnimalEvaluacionesTableProps = {
  evaluaciones: EvaluacionCC[];
  onRowClick: (evaluacion: EvaluacionCC) => void;
};

export function AnimalEvaluacionesTable({
  evaluaciones,
  onRowClick,
}: AnimalEvaluacionesTableProps) {
  return (
    <div className="animal-evaluaciones-table__wrapper">
      <Table.Root className="animales-table" interactive>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>CC</Table.ColumnHeader>
            <Table.ColumnHeader>Fecha</Table.ColumnHeader>
            <Table.ColumnHeader>Observaciones</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {evaluaciones.map((evaluacion) => (
            <Table.Row
              key={evaluacion.id}
              className="animales-table__row"
              tabIndex={0}
              role="button"
              aria-label={`Editar evaluación del ${formatFechaDeTimestamp(evaluacion.fecha)}`}
              onClick={() => onRowClick(evaluacion)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onRowClick(evaluacion);
                }
              }}>
              <Table.Cell>
                <span
                  className={`animal-evaluaciones-table__cc animal-evaluaciones-table__cc--${evaluacion.valor_cc}`}>
                  {evaluacion.valor_cc}
                </span>
              </Table.Cell>
              <Table.Cell>
                {formatFechaDeTimestamp(evaluacion.fecha)}
              </Table.Cell>
              <Table.Cell className="animal-evaluaciones-table__observaciones">
                {evaluacion.observaciones?.trim() || "Sin observaciones."}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </div>
  );
}
