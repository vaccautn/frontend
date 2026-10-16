import { useMemo, type KeyboardEvent, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Table } from "@chakra-ui/react";
import type { Animal } from "../types";
import type { LoteFiltroOption } from "./AnimalesFiltros";
import { formatFecha } from "../utils/formatDate";
import { nivelCC, type NivelCC } from "../utils/ccColor";
import { CATEGORIA_ANIMAL_LABELS } from "../constants";

// Mismo criterio que DashboardHistograma/MiniHistogramaCC/RodeoListaAnimales:
// color por nivel de alerta mes-dependiente, no por el valor de CC en sí.
const NIVEL_COLORS: Record<NivelCC, string> = {
  critico: "#c94c4c",
  atencion: "#e0a83e",
  normal: "#4a9163",
};

function colorPorNivelCC(valorCc: number, fechaCc: string | null): string {
  return NIVEL_COLORS[nivelCC(valorCc, fechaCc ?? new Date().toISOString())];
}

const COLUMNAS = [
  "Caravana",
  "Raza",
  "Sexo",
  "Fecha de nacimiento",
  "Lote",
  "Categoría del lote",
  "CC",
  "Estado",
];

export type CcAnimal = {
  valor_cc: number | null;
  escala_min: number;
  escala_max: number;
  fecha_cc: string | null;
};

type Props = {
  animales: Animal[];
  lotePorId: ReadonlyMap<number, LoteFiltroOption>;
  ccPorAnimal?: ReadonlyMap<number, CcAnimal>;
  onLoteNombreClick?: (loteId: number) => void;
  loading?: boolean;
  error?: string;
};

export function AnimalesTabla({
  animales,
  lotePorId,
  ccPorAnimal,
  onLoteNombreClick,
  loading = false,
  error = "",
}: Props) {
  const navigate = useNavigate();

  const lotesRepresentados = useMemo(() => {
    const ids = new Set(animales.map((a) => a.lote_id ?? "sin-lote"));
    return ids.size;
  }, [animales]);

  const handleRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    animal: Animal,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate(`/rodeo/${animal.id}`);
    }
  };

  const handleLoteClick = (event: MouseEvent, loteId: number | null) => {
    if (!onLoteNombreClick || loteId === null) return;
    event.stopPropagation();
    onLoteNombreClick(loteId);
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p className="status-message error">{error}</p>;

  return (
    <div className="animales-table__wrapper">
      <div className="animales-table__summary">
        <div>
          <span className="animales-table__summary-label">Lotes representados</span>
          <strong>{lotesRepresentados}</strong>
        </div>
        <div>
          <span className="animales-table__summary-label">Animales listados</span>
          <strong>{animales.length}</strong>
        </div>
      </div>

      <Table.Root className="animales-table" interactive>
        <Table.Header>
          <Table.Row>
            {COLUMNAS.map((columna) => (
              <Table.ColumnHeader key={columna}>{columna}</Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {animales.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={COLUMNAS.length}>
                No se encontraron animales con los filtros aplicados.
              </Table.Cell>
            </Table.Row>
          ) : (
            animales.map((animal) => {
              const lote = animal.lote_id !== null ? lotePorId.get(animal.lote_id) : undefined;
              const cc = ccPorAnimal?.get(animal.id);
              return (
                <Table.Row
                  key={animal.id}
                  className="animales-table__row"
                  tabIndex={0}
                  role="button"
                  aria-label={`Ver detalle de ${animal.caravana ?? `animal #${animal.id}`}`}
                  onClick={() => navigate(`/rodeo/${animal.id}`)}
                  onKeyDown={(event) => handleRowKeyDown(event, animal)}>
                  <Table.Cell>{animal.caravana ?? "—"}</Table.Cell>
                  <Table.Cell>{animal.raza}</Table.Cell>
                  <Table.Cell>{animal.sexo}</Table.Cell>
                  <Table.Cell>
                    {animal.fecha_nacimiento ? formatFecha(animal.fecha_nacimiento) : "—"}
                  </Table.Cell>
                  <Table.Cell>
                    {animal.lote_id !== null ? (
                      <span
                        onClick={(event) => handleLoteClick(event, animal.lote_id)}
                        style={
                          onLoteNombreClick
                            ? { cursor: "pointer", color: "var(--accent-strong)", fontWeight: 600 }
                            : undefined
                        }>
                        {lote?.nombre ?? "—"}
                      </span>
                    ) : (
                      "Sin lote"
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {lote ? (CATEGORIA_ANIMAL_LABELS[lote.categoria] ?? "—") : "—"}
                  </Table.Cell>
                  <Table.Cell style={{ fontWeight: 700, color: cc?.valor_cc != null ? colorPorNivelCC(cc.valor_cc, cc.fecha_cc) : undefined }}>
                    {cc?.valor_cc != null ? cc.valor_cc.toFixed(1) : "—"}
                  </Table.Cell>
                  <Table.Cell>{animal.estado}</Table.Cell>
                </Table.Row>
              );
            })
          )}
        </Table.Body>
      </Table.Root>
    </div>
  );
}
