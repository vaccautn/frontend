import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  Button,
  Dialog,
  Field,
  Menu,
  Portal,
  Spinner,
  Textarea,
} from "@chakra-ui/react";
import {
  IconChevronDown,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import { normalizeBackendDetail } from "@/features/auth";
import { DEFAULT_CC_SCALE } from "@/features/animales/constants";
import {
  anularEvaluacionCcEnSesion,
  eliminarImagenEvaluacion,
  getImagenesEvaluacion,
  subirImagenesEvaluacion,
  updateEvaluacionCc,
} from "@/features/animales/services/animalesService";
import type {
  EvaluacionCC,
  EvidenciaImagenRead,
} from "@/features/animales/types";
import { formatFechaDeTimestamp } from "@/features/animales/utils/formatDate";
import { getImagenUploadErrorMessage } from "@/features/animales/utils/imagenUploadErrors";
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

type AnimalEvaluacionCCDialogProps = {
  evaluacion: EvaluacionCC;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  onDeleted: () => Promise<void> | void;
};

export function AnimalEvaluacionCCDialog({
  evaluacion,
  onClose,
  onSaved,
  onDeleted,
}: AnimalEvaluacionCCDialogProps) {
  const [valorCc, setValorCc] = useState(evaluacion.valor_cc);
  const [observaciones, setObservaciones] = useState(evaluacion.observaciones);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [imagenes, setImagenes] = useState<EvidenciaImagenRead[]>([]);
  const [imagenesLoading, setImagenesLoading] = useState(true);
  const [imagenesError, setImagenesError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [confirmDeleteImage, setConfirmDeleteImage] =
    useState<EvidenciaImagenRead | null>(null);
  const [fullscreenImage, setFullscreenImage] =
    useState<EvidenciaImagenRead | null>(null);
  const [confirmDeleteEvaluacion, setConfirmDeleteEvaluacion] = useState(false);
  const [isDeletingEvaluacion, setIsDeletingEvaluacion] = useState(false);
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
        if (isMounted)
          setImagenesError(
            "No pudimos cargar las imágenes de esta evaluación.",
          );
      })
      .finally(() => {
        if (isMounted) setImagenesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [evaluacion.id]);

  const pending = isSaving || isDeletingEvaluacion;

  const handleGuardar = async () => {
    if (pending) return;
    setFormError("");
    setIsSaving(true);
    try {
      await updateEvaluacionCc(evaluacion.id, {
        valor_cc: valorCc,
        observaciones,
      });
      await onSaved();
      toast.success("Evaluación actualizada correctamente.");
      onClose();
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? normalizeBackendDetail(error.detail)
          : "No se pudo actualizar la evaluación. Probá nuevamente.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddImageClick = () => fileInputRef.current?.click();

  const handleFileInputChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const nuevas = await subirImagenesEvaluacion(evaluacion.id, files);
      setImagenes((current) => [...current, ...nuevas]);
      toast.success(
        nuevas.length > 1
          ? "Imágenes subidas correctamente."
          : "Imagen subida correctamente.",
      );
    } catch (error) {
      toast.error(getImagenUploadErrorMessage(error, files.length));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImageConfirmed = async () => {
    if (!confirmDeleteImage) return;
    const imagen = confirmDeleteImage;
    setIsDeletingImage(true);
    try {
      await eliminarImagenEvaluacion(imagen.id);
      setImagenes((current) => current.filter((item) => item.id !== imagen.id));
      setConfirmDeleteImage(null);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? (normalizeBackendDetail(error.detail) ??
              "No pudimos eliminar la imagen.")
          : "No pudimos eliminar la imagen.",
      );
    } finally {
      setIsDeletingImage(false);
    }
  };

  const handleDeleteEvaluacionConfirmed = async () => {
    setIsDeletingEvaluacion(true);
    try {
      await anularEvaluacionCcEnSesion(evaluacion.id, evaluacion.sesion_id);
      await onDeleted();
      toast.success("Evaluación eliminada.");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? (normalizeBackendDetail(error.detail) ??
              "No pudimos eliminar la evaluación.")
          : "No pudimos eliminar la evaluación.",
      );
      setIsDeletingEvaluacion(false);
      setConfirmDeleteEvaluacion(false);
    }
  };

  return (
    <>
      <Dialog.Root
        open
        onOpenChange={(details) => !details.open && !pending && onClose()}>
        <Portal>
          <Dialog.Backdrop className="animal-evaluacion__backdrop" />
          <Dialog.Positioner>
            <Dialog.Content className="animal-evaluacion__dialog">
              <Dialog.Header className="animal-evaluacion__header">
                <div>
                  <Dialog.Title>Editar evaluación</Dialog.Title>
                  <p>Evaluada el {formatFechaDeTimestamp(evaluacion.fecha)}</p>
                </div>
                <Dialog.CloseTrigger asChild>
                  <button
                    type="button"
                    className="animal-form__close"
                    aria-label="Cerrar edición"
                    disabled={pending}>
                    ✕
                  </button>
                </Dialog.CloseTrigger>
              </Dialog.Header>

              <Dialog.Body className="animal-evaluacion__body">
                {formError && (
                  <p className="status-message error" role="alert">
                    {formError}
                  </p>
                )}

                <div className="animal-form__fields">
                  <Field.Root required>
                    <Field.Label>Condición corporal</Field.Label>
                    <Menu.Root>
                      <Menu.Trigger asChild>
                        <button
                          type="button"
                          className="animal-evaluacion__valor-trigger"
                          disabled={pending}
                          aria-label="Seleccionar valor de CC">
                          <span>{valorCc}</span>
                          <IconChevronDown
                            className="animal-evaluacion__valor-caret"
                            size={16}
                            stroke={1.5}
                          />
                        </button>
                      </Menu.Trigger>
                      <Portal>
                        <Menu.Positioner>
                          <Menu.Content className="animal-evaluacion__valor-menu">
                            <Menu.RadioItemGroup
                              value={String(valorCc)}
                              onValueChange={(details) =>
                                setValorCc(Number(details.value))
                              }>
                              {SCALE_OPTIONS.map((option) => (
                                <Menu.RadioItem
                                  key={option}
                                  value={String(option)}>
                                  {option}
                                </Menu.RadioItem>
                              ))}
                            </Menu.RadioItemGroup>
                          </Menu.Content>
                        </Menu.Positioner>
                      </Portal>
                    </Menu.Root>
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Observaciones</Field.Label>
                    <Textarea
                      value={observaciones}
                      onChange={(event) => setObservaciones(event.target.value)}
                      rows={3}
                      disabled={pending}
                      placeholder="Agregá una observación si hace falta."
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Imágenes</Field.Label>
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
                          <div
                            key={imagen.id}
                            className="animal-imagenes__thumb-wrap">
                            <button
                              type="button"
                              className="animal-imagenes__thumb"
                              aria-label="Ver imagen en pantalla completa"
                              onClick={() => setFullscreenImage(imagen)}>
                              <img
                                src={imagen.url}
                                alt="Evidencia visual de la evaluación"
                              />
                            </button>
                            <button
                              type="button"
                              className="animal-imagenes__thumb-delete"
                              aria-label="Eliminar imagen"
                              onClick={() => setConfirmDeleteImage(imagen)}>
                              <IconX size={12} stroke={2} />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="animal-imagenes__add-thumb"
                          aria-label="Agregar imagen"
                          onClick={handleAddImageClick}
                          disabled={isUploading}>
                          {isUploading ? (
                            <Spinner size="xs" />
                          ) : (
                            <IconPlus size={20} stroke={1.75} />
                          )}
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
                  </Field.Root>
                </div>
              </Dialog.Body>

              <Dialog.Footer className="animal-evaluacion__footer animal-evaluacion__footer--split">
                <Button
                  variant="ghost"
                  colorPalette="red"
                  onClick={() => setConfirmDeleteEvaluacion(true)}
                  disabled={pending}>
                  <IconTrash size={16} stroke={1.5} />
                  Eliminar
                </Button>
                <div className="animal-evaluacion__footer-actions">
                  <Button variant="ghost" onClick={onClose} disabled={pending}>
                    Cancelar
                  </Button>
                  <Button
                    colorPalette="brand"
                    onClick={handleGuardar}
                    loading={isSaving}
                    disabled={pending}>
                    Guardar cambios
                  </Button>
                </div>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

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
                    disabled={isDeletingImage}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="animal-imagenes__confirm-delete"
                    onClick={handleDeleteImageConfirmed}
                    disabled={isDeletingImage}>
                    {isDeletingImage ? <Spinner size="xs" /> : "Eliminar"}
                  </button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <Dialog.Root
        open={confirmDeleteEvaluacion}
        onOpenChange={(details) => {
          if (!details.open && !isDeletingEvaluacion)
            setConfirmDeleteEvaluacion(false);
        }}>
        <Portal>
          <Dialog.Backdrop className="animal-evaluacion__backdrop" />
          <Dialog.Positioner>
            <Dialog.Content className="animal-imagenes__confirm-dialog">
              <div className="animal-imagenes__confirm-body">
                <p>
                  ¿Estás seguro de que querés eliminar esta evaluación? Dejará
                  de aparecer en el historial del animal.
                </p>
                <div className="animal-imagenes__confirm-actions">
                  <button
                    type="button"
                    className="animal-imagenes__confirm-cancel"
                    onClick={() => setConfirmDeleteEvaluacion(false)}
                    disabled={isDeletingEvaluacion}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="animal-imagenes__confirm-delete"
                    onClick={handleDeleteEvaluacionConfirmed}
                    disabled={isDeletingEvaluacion}>
                    {isDeletingEvaluacion ? <Spinner size="xs" /> : "Eliminar"}
                  </button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
