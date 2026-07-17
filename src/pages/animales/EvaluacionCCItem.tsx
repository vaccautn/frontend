import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Dialog, Menu, Portal, Spinner } from "@chakra-ui/react";
import {
  IconCheck,
  IconChevronDown,
  IconPencil,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import { normalizeBackendDetail } from "@/features/auth";
import { DEFAULT_CC_SCALE } from "@/features/animales/constants";
import {
  eliminarImagenEvaluacion,
  getImagenesEvaluacion,
  subirImagenesEvaluacion,
  updateEvaluacionCc,
} from "@/features/animales/services/animalesService";
import type { EvaluacionCC, EvidenciaImagenRead } from "@/features/animales/types";
import { formatFechaDeTimestamp } from "@/features/animales/utils/formatDate";
import { ApiError } from "@/services/httpClient";

function buildScaleOptions() {
  const options: number[] = [];
  for (
    let value = DEFAULT_CC_SCALE.min;
    value <= DEFAULT_CC_SCALE.max;
    value += DEFAULT_CC_SCALE.step
  ) {
    options.push(value);
  }
  return options;
}

const SCALE_OPTIONS = buildScaleOptions();

type EvaluacionCCItemProps = {
  evaluacion: EvaluacionCC;
  onUpdated: () => Promise<void> | void;
};

export function EvaluacionCCItem({ evaluacion, onUpdated }: EvaluacionCCItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nextValue, setNextValue] = useState(evaluacion.valor_cc);
  const [isSaving, setIsSaving] = useState(false);

  const [imagenes, setImagenes] = useState<EvidenciaImagenRead[]>([]);
  const [imagenesLoading, setImagenesLoading] = useState(true);
  const [imagenesError, setImagenesError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<EvidenciaImagenRead | null>(null);
  const [confirmDeleteImage, setConfirmDeleteImage] = useState<EvidenciaImagenRead | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          setImagenesError("No pudimos cargar las imágenes de esta evaluación.");
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

  const startEditing = () => {
    setNextValue(evaluacion.valor_cc);
    setIsEditing(true);
  };

  const cancelEditing = () => setIsEditing(false);

  const saveEditing = async () => {
    if (nextValue === evaluacion.valor_cc) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await updateEvaluacionCc(evaluacion.id, { valor_cc: nextValue });
      await onUpdated();
      toast.success("Evaluación de condición corporal actualizada.");
      setIsEditing(false);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(
          normalizeBackendDetail(error.detail) ??
            "No pudimos actualizar la evaluación en este momento.",
        );
      } else {
        toast.error("No pudimos actualizar la evaluación en este momento.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const nuevas = await subirImagenesEvaluacion(evaluacion.id, files);
      setImagenes((current) => [...current, ...nuevas]);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? (normalizeBackendDetail(error.detail) ??
              "No pudimos subir una o más imágenes.")
          : "No pudimos subir una o más imágenes.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDeleteImage) return;

    const imagen = confirmDeleteImage;
    setIsDeleting(true);
    try {
      await eliminarImagenEvaluacion(imagen.id);
      setImagenes((current) => current.filter((item) => item.id !== imagen.id));
      setConfirmDeleteImage(null);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? (normalizeBackendDetail(error.detail) ?? "No pudimos eliminar la imagen.")
          : "No pudimos eliminar la imagen.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article className="animal-evaluaciones__item">
      <div
        className={`animal-evaluaciones__item-header animal-evaluaciones__item-header--cc-${evaluacion.valor_cc}`}>
        {isEditing ? (
          <div className="animal-evaluaciones__edit">
            <Menu.Root>
              <Menu.Trigger asChild>
                <button
                  type="button"
                  className="animal-evaluacion__valor-trigger animal-evaluaciones__edit-trigger"
                  aria-label="Editar valor de CC"
                  disabled={isSaving}>
                  <span>CC {nextValue}</span>
                  <IconChevronDown size={16} stroke={1.5} />
                </button>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content className="animal-evaluacion__valor-menu">
                    {SCALE_OPTIONS.map((option) => (
                      <Menu.Item
                        key={option}
                        value={String(option)}
                        onSelect={() => setNextValue(option)}>
                        {option}
                      </Menu.Item>
                    ))}
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
            <button
              type="button"
              className="animal-evaluaciones__edit-confirm"
              aria-label="Guardar valor de CC"
              onClick={saveEditing}
              disabled={isSaving}>
              <IconCheck size={16} stroke={2} />
            </button>
            <button
              type="button"
              className="animal-evaluaciones__edit-cancel"
              aria-label="Cancelar edición"
              onClick={cancelEditing}
              disabled={isSaving}>
              <IconX size={16} stroke={2} />
            </button>
          </div>
        ) : (
          <div className="animal-evaluaciones__value">
            <strong>CC: {String(evaluacion.valor_cc)}</strong>
            <button
              type="button"
              className="animal-evaluaciones__edit-trigger-btn"
              aria-label="Editar valor de CC"
              onClick={startEditing}>
              <IconPencil size={14} stroke={1.75} />
            </button>
          </div>
        )}
        <span>{formatFechaDeTimestamp(evaluacion.fecha)}</span>
      </div>
      {/*<p className="animal-evaluaciones__meta">
        Escala {evaluacion.escala_min} a {evaluacion.escala_max}
      </p>*/}
      <p>{evaluacion.observaciones?.trim() || "Sin observaciones."}</p>

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

      {!imagenesLoading && !imagenesError && (
        <div className="animal-imagenes__grid">
          {imagenes.map((imagen) => (
            <Menu.Root key={imagen.id}>
              <Menu.ContextTrigger asChild>
                <button
                  type="button"
                  className="animal-imagenes__thumb"
                  aria-label="Ver imagen en pantalla completa"
                  onClick={() => setFullscreenImage(imagen)}>
                  <img src={imagen.url} alt="Evidencia visual de la evaluación" />
                </button>
              </Menu.ContextTrigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content className="animal-evaluacion__valor-menu">
                    <Menu.Item
                      value="eliminar"
                      className="animal-imagenes__menu-delete-item"
                      onSelect={() => setConfirmDeleteImage(imagen)}>
                      <IconTrash size={14} stroke={1.75} />
                      Eliminar imagen
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          ))}

          <button
            type="button"
            className="animal-imagenes__add-thumb"
            aria-label="Agregar imagen"
            onClick={handleAddImageClick}
            disabled={isUploading}>
            {isUploading ? <Spinner size="xs" /> : <IconPlus size={20} stroke={1.75} />}
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFileInputChange}
      />

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

      <Dialog.Root
        open={!!confirmDeleteImage}
        onOpenChange={(details) => {
          if (!details.open) setConfirmDeleteImage(null);
        }}>
        <Portal>
          <Dialog.Backdrop className="animal-evaluacion__backdrop" />
          <Dialog.Positioner>
            <Dialog.Content className="animal-imagenes__confirm-dialog">
              <div className="animal-imagenes__confirm-body">
                <p>¿Estás seguro de que querés eliminar esta imagen?</p>
                <div className="animal-imagenes__confirm-actions">
                  <button
                    type="button"
                    className="animal-imagenes__confirm-cancel"
                    onClick={() => setConfirmDeleteImage(null)}
                    disabled={isDeleting}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="animal-imagenes__confirm-delete"
                    onClick={handleDeleteConfirmed}
                    disabled={isDeleting}>
                    {isDeleting ? <Spinner size="xs" /> : "Eliminar"}
                  </button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </article>
  );
}
