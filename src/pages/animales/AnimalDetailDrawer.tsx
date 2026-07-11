import { useMemo, useState } from "react";
import { Badge, Button, Drawer, Portal } from "@chakra-ui/react";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import type { Animal, EvaluacionCC } from "@/features/animales/types";
import { EvaluacionCCItem } from "./EvaluacionCCItem";
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
                    <div className="animal-detail__header-end">
                      <Badge colorPalette="brand" className="animal-detail__badge">
                        {animal.estado}
                      </Badge>
                      <div className="animal-detail__header-actions">
                        <button
                          type="button"
                          className="animal-detail__action"
                          onClick={() => onEditar(animal)}>
                          <IconEdit size={16} stroke={1.5} />
                          Editar
                        </button>
                        <span
                          className={`animal-detail__action-tooltip-target${
                            canStartBajaFlow
                              ? ""
                              : " animal-detail__action-tooltip-target--disabled"
                          }`}
                          title={
                            canStartBajaFlow
                              ? undefined
                              : "No es posible dar de baja o eliminar al animal porque ya no se encuentra activo."
                          }>
                          <button
                            type="button"
                            className="animal-detail__action animal-detail__action--danger"
                            onClick={() => onEliminar(animal)}
                            disabled={!canStartBajaFlow}>
                            <IconTrash size={16} stroke={1.5} />
                            Eliminar
                          </button>
                        </span>
                      </div>
                    </div>
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

                        <span
                          title={
                            canRegisterEvaluation
                              ? undefined
                              : "No es posible registrar una evaluación porque el animal no se encuentra activo."
                          }>
                          <Button
                            colorPalette="brand"
                            onClick={openEvaluacionDialog}
                            disabled={!canRegisterEvaluation}>
                            <IconPlus size={18} stroke={1.5} />
                            Registrar evaluación de CC
                          </Button>
                        </span>
                      </div>

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
                            <EvaluacionCCItem
                              key={evaluacion.id}
                              evaluacion={evaluacion}
                              onUpdated={onRefreshHistory}
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  </Drawer.Body>
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
