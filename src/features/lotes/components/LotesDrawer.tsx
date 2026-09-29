import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  Button,
  Dialog,
  Drawer,
  Field,
  Input,
  NativeSelect,
  Portal,
} from "@chakra-ui/react";
import { IconCheck, IconPencil, IconTrash, IconX } from "@tabler/icons-react";
import { toast } from "react-toastify";
import {
  createLote,
  eliminarLote,
  updateLote,
} from "@/features/lotes/services/lotesService";
import type { LoteOption } from "@/features/lotes/types";
import {
  CATEGORIAS_ANIMAL,
  CATEGORIA_ANIMAL_LABELS,
} from "@/features/animales/constants";
import { normalizeBackendDetail, useAuth } from "@/features/auth";
import { ApiError } from "@/services/httpClient";
import "@/features/animales/components/animales.css";
import "@/features/lotes/components/lotes-drawer.css";

type Props = {
  open: boolean;
  onClose: () => void;
  lotes: LoteOption[];
  onChanged: () => void;
};

export function LotesDrawer({ open, onClose, lotes, onChanged }: Props) {
  const { user } = useAuth();

  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoCategoria, setNuevoCategoria] = useState("");
  const [nuevoError, setNuevoError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNombre, setEditingNombre] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [loteAEliminar, setLoteAEliminar] = useState<LoteOption | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const startEditing = (lote: LoteOption) => {
    setEditingId(lote.id);
    setEditingNombre(lote.nombre);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingNombre("");
  };

  const handleCrear = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isCreating) return;

    if (!nuevoNombre.trim()) {
      setNuevoError("El nombre del lote es obligatorio.");
      return;
    }
    if (!nuevoCategoria) {
      setNuevoError("La categoría del lote es obligatoria.");
      return;
    }

    setIsCreating(true);
    try {
      await createLote({
        nombre: nuevoNombre.trim(),
        descripcion: "",
        categoria: nuevoCategoria,
        usuario_administrador_id: user?.id ?? 0,
        activo: true,
      });
      toast.success("Lote creado correctamente.");
      setNuevoNombre("");
      setNuevoCategoria("");
      setNuevoError("");
      onChanged();
    } catch (error) {
      setNuevoError(
        error instanceof ApiError
          ? normalizeBackendDetail(error.detail)
          : "No se pudo crear el lote. Probá nuevamente.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleGuardarNombre = async (lote: LoteOption) => {
    const nombre = editingNombre.trim();
    if (!nombre) {
      toast.error("El nombre del lote no puede quedar vacío.");
      return;
    }
    if (nombre === lote.nombre) {
      cancelEditing();
      return;
    }

    setIsSaving(true);
    try {
      await updateLote(lote.id, { nombre });
      toast.success("Nombre del lote actualizado.");
      cancelEditing();
      onChanged();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? normalizeBackendDetail(error.detail)
          : "No se pudo actualizar el lote.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!loteAEliminar) return;
    setIsDeleting(true);
    try {
      await eliminarLote(loteAEliminar.id);
      toast.success("Lote eliminado correctamente.");
      setLoteAEliminar(null);
      onChanged();
    } catch {
      // El backend no distingue en el body por qué falló el delete (puede
      // ser una violación de FK por animales o servicios asociados): se
      // avisa con un mensaje que cubre el caso más probable.
      toast.error(
        "No se pudo eliminar el lote. Puede tener animales o servicios asociados: reasignalos primero.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Drawer.Root
        open={open}
        onOpenChange={(details) => {
          if (!details.open) onClose();
        }}
        placement="end"
        size="md">
        <Portal>
          <Drawer.Backdrop className="animal-form__backdrop" />
          <Drawer.Positioner>
            <Drawer.Content className="animal-form">
              <Drawer.Header className="animal-form__header">
                <Drawer.Title>Lotes</Drawer.Title>
                <Drawer.CloseTrigger asChild>
                  <button
                    type="button"
                    className="animal-form__close"
                    aria-label="Cerrar">
                    ✕
                  </button>
                </Drawer.CloseTrigger>
              </Drawer.Header>

              <Drawer.Body className="animal-form__body">
                <form
                  onSubmit={handleCrear}
                  noValidate
                  className="lotes-drawer__crear">
                  {nuevoError && (
                    <p className="status-message error" role="alert">
                      {nuevoError}
                    </p>
                  )}

                  <Field.Root>
                    <Field.Label>Nombre del lote nuevo</Field.Label>
                    <Input
                      value={nuevoNombre}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        setNuevoNombre(event.target.value);
                        setNuevoError("");
                      }}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Categoría</Field.Label>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        value={nuevoCategoria}
                        onChange={(event) => {
                          setNuevoCategoria(event.target.value);
                          setNuevoError("");
                        }}>
                        <option value="">Seleccioná una categoría</option>
                        {CATEGORIAS_ANIMAL.map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field.Root>

                  <Button
                    type="submit"
                    colorPalette="brand"
                    loading={isCreating}
                    loadingText="Creando...">
                    Crear lote
                  </Button>
                </form>

                <div className="lotes-drawer__divider" />

                {lotes.length === 0 ? (
                  <p className="status-message">Todavía no hay lotes creados.</p>
                ) : (
                  <ul className="lotes-drawer__lista">
                    {lotes.map((lote) => {
                      const isEditing = editingId === lote.id;
                      return (
                        <li key={lote.id} className="lotes-drawer__item">
                          {isEditing ? (
                            <Input
                              size="sm"
                              autoFocus
                              value={editingNombre}
                              onChange={(event) =>
                                setEditingNombre(event.target.value)
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  handleGuardarNombre(lote);
                                }
                                if (event.key === "Escape") cancelEditing();
                              }}
                            />
                          ) : (
                            <div className="lotes-drawer__item-info">
                              <span className="lotes-drawer__item-nombre">
                                {lote.nombre}
                              </span>
                              <span className="lotes-drawer__item-categoria">
                                {CATEGORIA_ANIMAL_LABELS[lote.categoria] ??
                                  lote.categoria}
                              </span>
                            </div>
                          )}

                          <div className="lotes-drawer__item-actions">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  className="lotes-drawer__icon-btn"
                                  aria-label="Guardar nombre"
                                  disabled={isSaving}
                                  onClick={() => handleGuardarNombre(lote)}>
                                  <IconCheck size={16} stroke={2} />
                                </button>
                                <button
                                  type="button"
                                  className="lotes-drawer__icon-btn"
                                  aria-label="Cancelar edición"
                                  disabled={isSaving}
                                  onClick={cancelEditing}>
                                  <IconX size={16} stroke={2} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="lotes-drawer__icon-btn"
                                  aria-label={`Renombrar ${lote.nombre}`}
                                  onClick={() => startEditing(lote)}>
                                  <IconPencil size={16} stroke={1.75} />
                                </button>
                                <button
                                  type="button"
                                  className="lotes-drawer__icon-btn lotes-drawer__icon-btn--danger"
                                  aria-label={`Eliminar ${lote.nombre}`}
                                  onClick={() => setLoteAEliminar(lote)}>
                                  <IconTrash size={16} stroke={1.75} />
                                </button>
                              </>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>

      <Dialog.Root
        open={loteAEliminar !== null}
        onOpenChange={(details) => !details.open && setLoteAEliminar(null)}>
        <Portal>
          <Dialog.Backdrop className="animal-evaluacion__backdrop" />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Eliminar lote</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                Se eliminará el lote "{loteAEliminar?.nombre}". Si tiene
                animales o servicios asociados, no se va a poder eliminar
                hasta que los reasignes.
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="ghost"
                  onClick={() => setLoteAEliminar(null)}
                  disabled={isDeleting}>
                  Cancelar
                </Button>
                <Button
                  colorPalette="red"
                  onClick={handleEliminar}
                  loading={isDeleting}>
                  Eliminar
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
