import { Badge, Drawer, Portal } from "@chakra-ui/react";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import type { Animal } from "@/features/animales/types";

type AnimalDetailDrawerProps = {
  animal: Animal | null;
  onClose: () => void;
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
  onClose,
  onEditar,
  onEliminar,
}: AnimalDetailDrawerProps) {
  return (
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
                    onClick={() => onEliminar(animal)}>
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
  );
}
