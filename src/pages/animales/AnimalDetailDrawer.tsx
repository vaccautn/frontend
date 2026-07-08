import { useMemo, useState } from "react";
import { Badge, Button, Drawer, Portal } from "@chakra-ui/react";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import type { Animal, EvaluacionCC } from "@/features/animales/types";
import { RegistrarEvaluacionCCDialog } from "./RegistrarEvaluacionCCDialog";

type AnimalDetailDrawerProps = {
  animal: Animal | null;
  evaluaciones: EvaluacionCC[];
  historyLoading: boolean;
  historyError: string;
  onClose: () => void;
  onRefreshHistory: () => Promise<void> | void;
  onEditar: (animal: Animal) => void;
  onEliminar: (animal: Animal) => void;
};

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

const CAMPOS: { label: string; render: (animal: Animal) => string }[] = [
  { label: "Caravana", render: (a) => a.caravana ?? "—" },
  { label: "Raza", render: (a) => a.raza },
  { label: "Sexo", render: (a) => a.sexo },
  { label: "Fecha de nacimiento", render: (a) => a.fecha_nacimiento ?? "—" },
  { label: "Estado", render: (a) => a.estado },
  { label: "Observación", render: (a) => a.observacion || "—" },
];

export function AnimalDetailDrawer({
  animal,
  evaluaciones,
  historyLoading,
  historyError,
  onClose,
  onRefreshHistory,
  onEditar,
  onEliminar,
}: AnimalDetailDrawerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogInstanceKey, setDialogInstanceKey] = useState(0);

  const canRegisterEvaluation = animal?.estado === "ACTIVO";
  const canStartBajaFlow = animal?.estado === "ACTIVO";

  const openEvaluacionDialog = () => {
    setDialogInstanceKey((current) => current + 1);
    setIsDialogOpen(true);
  };

  const historyItems = useMemo(() => {
    return [...evaluaciones].sort((first, second) => {
      const secondDate = new Date(second.fecha).getTime();
      const firstDate = new Date(first.fecha).getTime();

      return secondDate - firstDate || second.id - first.id;
    });
  }, [evaluaciones]);

  return (
    <>
      <Drawer.Root
        open={!!animal}
        onOpenChange={(details) => {
          if (!details.open) onClose();
        }}
        placement="end"
        size="lg">
        <Portal>
          <Drawer.Backdrop className="animal-detail__backdrop" />
          <Drawer.Positioner>
            <Drawer.Content className="animal-detail">
              {animal && (
                <>
                  <Drawer.Header className="animal-detail__header">
                    <div>
                      <span className="animal-detail__eyebrow">Animal</span>
                      <Drawer.Title>
                        {animal.caravana ?? `#${animal.id}`}
                      </Drawer.Title>
                    </div>
                    <Badge colorPalette="brand" className="animal-detail__badge">
                      {animal.estado}
                    </Badge>
                  </Drawer.Header>

                  <Drawer.Body className="animal-detail__body">
                    <dl className="animal-detail__grid">
                      {CAMPOS.map(({ label, render }) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{render(animal)}</dd>
                        </div>
                      ))}
                    </dl>

                    <section className="animal-detail__section">
                      <div className="animal-detail__section-header">
                        <div>
                          <span className="animal-detail__section-eyebrow">
                            Condición corporal
                          </span>
                          <h2>Historial de evaluaciones</h2>
                        </div>

                        <Button
                          colorPalette="brand"
                          onClick={openEvaluacionDialog}
                          disabled={!canRegisterEvaluation}>
                          <IconPlus size={18} stroke={1.5} />
                          Registrar evaluación de CC
                        </Button>
                      </div>

                      {!canRegisterEvaluation && (
                        <p className="animal-detail__hint animal-detail__hint--warning">
                          No es posible registrar una evaluación porque el animal no se encuentra activo.
                        </p>
                      )}

                      {!canStartBajaFlow && (
                        <p className="animal-detail__hint animal-detail__hint--warning">
                          No es posible dar de baja o eliminar al animal porque ya no se encuentra activo.
                        </p>
                      )}

                      {historyLoading && <p>Cargando historial...</p>}

                      {historyError && (
                        <p className="status-message error" role="alert">
                          {historyError}
                        </p>
                      )}

                      {!historyLoading && !historyError && historyItems.length === 0 && (
                        <p className="animal-detail__empty">
                          Este animal todavía no tiene evaluaciones registradas.
                        </p>
                      )}

                      {!historyLoading && !historyError && historyItems.length > 0 && (
                        <div className="animal-evaluaciones__list">
                          {historyItems.map((evaluacion) => (
                            <article
                              key={evaluacion.id}
                                className="animal-evaluaciones__item">
                              <div className="animal-evaluaciones__item-header">
                                <strong>CC {String(evaluacion.valor_cc)}</strong>
                                <span>
                                  {DATE_TIME_FORMATTER.format(new Date(evaluacion.fecha))}
                                </span>
                              </div>
                              <p className="animal-evaluaciones__meta">
                                Escala {evaluacion.escala_min} a {evaluacion.escala_max}
                              </p>
                              <p>
                                {evaluacion.observaciones?.trim() || "Sin observaciones."}
                              </p>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>
                  </Drawer.Body>

                  <Drawer.Footer className="animal-detail__footer">
                    <button
                      type="button"
                      className="animal-detail__action"
                      onClick={() => onEditar(animal)}>
                      <IconEdit size={18} stroke={1.5} />
                      Editar
                    </button>
                    <button
                      type="button"
                      className="animal-detail__action animal-detail__action--danger"
                      onClick={() => onEliminar(animal)}
                      disabled={!canStartBajaFlow}>
                      <IconTrash size={18} stroke={1.5} />
                      Eliminar
                    </button>
                  </Drawer.Footer>
                </>
              )}
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>

      <RegistrarEvaluacionCCDialog
        key={`${animal?.id ?? "sin-animal"}-${dialogInstanceKey}`}
        animal={animal}
        open={isDialogOpen && !!animal}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={onRefreshHistory}
      />
    </>
  );
}
