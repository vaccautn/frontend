import { Fragment, useEffect, useState } from "react";
import { Portal, Spinner, Table } from "@chakra-ui/react";
import { IconChevronDown, IconPencil, IconX } from "@tabler/icons-react";
import { getImagenesEvaluacion } from "@/features/animales/services/animalesService";
import type { EvaluacionCC, EvidenciaImagenRead } from "@/features/animales/types";
import { formatFechaDeTimestamp } from "@/features/animales/utils/formatDate";

type AnimalEvaluacionesTableProps = {
  evaluaciones: EvaluacionCC[];
  onEdit: (evaluacion: EvaluacionCC) => void;
};

export function AnimalEvaluacionesTable({
  evaluaciones,
  onEdit,
}: AnimalEvaluacionesTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleRow = (id: number) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  return (
    <div className="animal-evaluaciones-table__wrapper">
      <Table.Root
        className="animales-table animal-evaluaciones-table"
        interactive>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>CC</Table.ColumnHeader>
            <Table.ColumnHeader>Fecha</Table.ColumnHeader>
            <Table.ColumnHeader>Observaciones</Table.ColumnHeader>
            <Table.ColumnHeader className="animal-evaluaciones-table__col-toggle" />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {evaluaciones.map((evaluacion) => {
            const isExpanded = expandedId === evaluacion.id;

            return (
              <Fragment key={evaluacion.id}>
                <Table.Row
                  className={`animales-table__row animal-evaluaciones-table__row${
                    isExpanded
                      ? " animal-evaluaciones-table__row--expanded"
                      : ""
                  }`}
                  tabIndex={0}
                  role="button"
                  aria-expanded={isExpanded}
                  aria-label={`Ver detalle de la evaluación del ${formatFechaDeTimestamp(evaluacion.fecha)}`}
                  onClick={() => toggleRow(evaluacion.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleRow(evaluacion.id);
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
                  <Table.Cell className="animal-evaluaciones-table__col-toggle">
                    <IconChevronDown
                      size={16}
                      stroke={1.75}
                      className={`animal-evaluaciones-table__chevron${
                        isExpanded
                          ? " animal-evaluaciones-table__chevron--open"
                          : ""
                      }`}
                    />
                  </Table.Cell>
                </Table.Row>

                {isExpanded && (
                  <Table.Row className="animal-evaluaciones-table__expand-row">
                    <Table.Cell colSpan={4}>
                      <AnimalEvaluacionRowDetail
                        evaluacion={evaluacion}
                        onEdit={() => onEdit(evaluacion)}
                      />
                    </Table.Cell>
                  </Table.Row>
                )}
              </Fragment>
            );
          })}
        </Table.Body>
      </Table.Root>
    </div>
  );
}

type AnimalEvaluacionRowDetailProps = {
  evaluacion: EvaluacionCC;
  onEdit: () => void;
};

function AnimalEvaluacionRowDetail({
  evaluacion,
  onEdit,
}: AnimalEvaluacionRowDetailProps) {
  const [imagenes, setImagenes] = useState<EvidenciaImagenRead[]>([]);
  const [imagenesLoading, setImagenesLoading] = useState(true);
  const [imagenesError, setImagenesError] = useState("");
  const [fullscreenImage, setFullscreenImage] =
    useState<EvidenciaImagenRead | null>(null);

  useEffect(() => {
    let isMounted = true;
    setImagenesLoading(true);
    setImagenesError("");

    getImagenesEvaluacion(evaluacion.id)
      .then((data) => {
        if (isMounted) setImagenes(data);
      })
      .catch(() => {
        if (isMounted) {
          setImagenesError(
            "No pudimos cargar las imágenes de esta evaluación.",
          );
        }
      })
      .finally(() => {
        if (isMounted) setImagenesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [evaluacion.id]);

  useEffect(() => {
    if (!fullscreenImage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreenImage(null);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenImage]);

  return (
    <div
      className="animal-evaluaciones-table__detail"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}>
      <div className="animal-evaluaciones-table__detail-section">
        <span className="animal-evaluaciones-table__detail-label">
          Observaciones
        </span>
        <p>{evaluacion.observaciones?.trim() || "Sin observaciones."}</p>
      </div>

      <div className="animal-evaluaciones-table__detail-section">
        <span className="animal-evaluaciones-table__detail-label">Fotos</span>

        {imagenesLoading && (
          <div className="animal-imagenes__loading">
            <Spinner size="xs" />
            <span>Cargando imágenes...</span>
          </div>
        )}

        {!imagenesLoading && imagenesError && (
          <p className="status-message error" role="alert">
            {imagenesError}
          </p>
        )}

        {!imagenesLoading && !imagenesError && imagenes.length === 0 && (
          <p className="animal-evaluaciones-table__detail-empty">
            Sin fotos asociadas a esta evaluación.
          </p>
        )}

        {!imagenesLoading && !imagenesError && imagenes.length > 0 && (
          <div className="animal-imagenes__grid animal-evaluaciones-table__detail-imagenes">
            {imagenes.map((imagen) => (
              <button
                key={imagen.id}
                type="button"
                className="animal-imagenes__thumb"
                aria-label="Ver imagen en pantalla completa"
                onClick={() => setFullscreenImage(imagen)}>
                <img
                  src={imagen.url}
                  alt="Evidencia visual de la evaluación"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className="animal-evaluaciones-table__detail-edit"
        onClick={onEdit}>
        <IconPencil size={14} stroke={1.75} />
        Editar evaluación
      </button>

      {fullscreenImage && (
        <Portal>
          <div
            className="animal-imagenes__lightbox"
            onClick={() => setFullscreenImage(null)}>
            <button
              type="button"
              className="animal-imagenes__lightbox-close"
              aria-label="Cerrar"
              onClick={(event) => {
                event.stopPropagation();
                setFullscreenImage(null);
              }}>
              <IconX size={20} stroke={1.75} />
            </button>
            <img
              src={fullscreenImage.url}
              alt="Evidencia visual de la evaluación en pantalla completa"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        </Portal>
      )}
    </div>
  );
}
