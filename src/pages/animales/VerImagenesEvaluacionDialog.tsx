import { useEffect, useState } from "react";
import {
  Box,
  Dialog,
  FileUpload,
  Icon,
  Popover,
  Portal,
  Spinner,
} from "@chakra-ui/react";
import { IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { toast } from "react-toastify";
import { normalizeBackendDetail } from "@/features/auth";
import {
  eliminarImagenEvaluacion,
  subirImagenesEvaluacion,
} from "@/features/animales/services/animalesService";
import type { EvaluacionCC, EvidenciaImagenRead } from "@/features/animales/types";
import { ApiError } from "@/services/httpClient";

type VerImagenesEvaluacionDialogProps = {
  evaluacion: EvaluacionCC;
  open: boolean;
  onClose: () => void;
  imagenes: EvidenciaImagenRead[];
  onImagenesChange: (
    updater: EvidenciaImagenRead[] | ((current: EvidenciaImagenRead[]) => EvidenciaImagenRead[]),
  ) => void;
  isLoading: boolean;
  loadError: string;
};

export function VerImagenesEvaluacionDialog({
  evaluacion,
  open,
  onClose,
  imagenes,
  onImagenesChange,
  isLoading,
  loadError,
}: VerImagenesEvaluacionDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<EvidenciaImagenRead | null>(null);

  useEffect(() => {
    if (!fullscreenImage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreenImage(null);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenImage]);

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const nuevas = await subirImagenesEvaluacion(evaluacion.id, files);
      onImagenesChange((current) => [...current, ...nuevas]);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? (normalizeBackendDetail(error.detail) ??
              "No pudimos subir una o más imágenes.")
          : "No pudimos subir una o más imágenes.",
      );
    } finally {
      setIsUploading(false);
      setPendingFiles([]);
    }
  };

  const handleDelete = async (imagen: EvidenciaImagenRead) => {
    setConfirmDeleteId(null);
    setDeletingId(imagen.id);
    try {
      await eliminarImagenEvaluacion(imagen.id);
      onImagenesChange((current) => current.filter((item) => item.id !== imagen.id));
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? (normalizeBackendDetail(error.detail) ?? "No pudimos eliminar la imagen.")
          : "No pudimos eliminar la imagen.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog.Root
      open={open}
      closeOnInteractOutside={!fullscreenImage}
      closeOnEscape={!fullscreenImage}
      onOpenChange={(details) => {
        if (!details.open) {
          setFullscreenImage(null);
          setIsAddOpen(false);
          onClose();
        }
      }}>
      <Portal>
        <Dialog.Backdrop className="animal-evaluacion__backdrop" />
        <Dialog.Positioner>
          <Dialog.Content className="animal-evaluacion__dialog animal-evaluacion__dialog--imagenes">
            <Dialog.Header className="animal-evaluacion__header">
              <div>
                <Dialog.Title>
                  Imágenes de la evaluación CC {evaluacion.valor_cc}
                </Dialog.Title>
                <p>Agregá o eliminá imágenes asociadas a esta evaluación.</p>
              </div>
              <Dialog.CloseTrigger asChild>
                <button
                  type="button"
                  className="animal-form__close"
                  aria-label="Cerrar">
                  ✕
                </button>
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body className="animal-evaluacion__body">
              {isLoading && (
                <div className="animal-imagenes__loading">
                  <Spinner size="sm" />
                  <span>Cargando imágenes...</span>
                </div>
              )}

              {!isLoading && loadError && (
                <p className="status-message error" role="alert">
                  {loadError}
                </p>
              )}

              {!isLoading && !loadError && imagenes.length === 0 && (
                <p className="animal-detail__empty">
                  Esta evaluación todavía no tiene imágenes asociadas.
                </p>
              )}

              {!isLoading && !loadError && imagenes.length > 0 && (
                <div className="animal-imagenes__grid">
                  {imagenes.map((imagen) => (
                    <div key={imagen.id} className="animal-imagenes__item">
                      <button
                        type="button"
                        className="animal-imagenes__preview-trigger"
                        aria-label="Ver imagen en pantalla completa"
                        onClick={() => setFullscreenImage(imagen)}>
                        <img src={imagen.url} alt="Evidencia visual de la evaluación" />
                      </button>
                      <Popover.Root
                        open={confirmDeleteId === imagen.id}
                        onOpenChange={(details) =>
                          setConfirmDeleteId(details.open ? imagen.id : null)
                        }
                        positioning={{ placement: "top" }}>
                        <Popover.Trigger asChild>
                          <button
                            type="button"
                            className="animal-imagenes__delete"
                            aria-label="Eliminar imagen"
                            disabled={deletingId === imagen.id}>
                            {deletingId === imagen.id ? (
                              <Spinner size="xs" />
                            ) : (
                              <IconTrash size={16} stroke={1.75} />
                            )}
                          </button>
                        </Popover.Trigger>
                        <Portal>
                          <Popover.Positioner>
                            <Popover.Content className="animal-imagenes__confirm">
                              <Popover.Arrow>
                                <Popover.ArrowTip />
                              </Popover.Arrow>
                              <Popover.Body className="animal-imagenes__confirm-body">
                                <p>¿Estás seguro de que querés eliminar esta imagen?</p>
                                <div className="animal-imagenes__confirm-actions">
                                  <button
                                    type="button"
                                    className="animal-imagenes__confirm-delete"
                                    onClick={() => handleDelete(imagen)}>
                                    Eliminar
                                  </button>
                                  <button
                                    type="button"
                                    className="animal-imagenes__confirm-cancel"
                                    onClick={() => setConfirmDeleteId(null)}>
                                    Cancelar
                                  </button>
                                </div>
                              </Popover.Body>
                            </Popover.Content>
                          </Popover.Positioner>
                        </Portal>
                      </Popover.Root>
                    </div>
                  ))}
                </div>
              )}

              <div className="animal-imagenes__add-row">
                {isAddOpen ? (
                  <button
                    type="button"
                    className="animal-imagenes__cancel-btn"
                    onClick={() => setIsAddOpen(false)}>
                    Cancelar
                  </button>
                ) : (
                  <button
                    type="button"
                    className="animal-imagenes__add-btn"
                    onClick={() => setIsAddOpen(true)}>
                    <IconPlus size={16} stroke={1.75} />
                    Agregar imágenes
                  </button>
                )}
              </div>

              {isAddOpen && (
                <FileUpload.Root
                  alignItems="stretch"
                  maxFiles={10}
                  acceptedFiles={pendingFiles}
                  onFileChange={(details) => {
                    setPendingFiles(details.acceptedFiles);
                    handleUpload(details.acceptedFiles);
                  }}>
                  <FileUpload.HiddenInput />
                  <FileUpload.Dropzone className="dropzone">
                    <Icon size="md" color="fg.muted">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="#888">
                        <path d="M440-320v-326L336-542l-56-58 200-200 200 200-56 58-104-104v326h-80ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" />
                      </svg>
                    </Icon>
                    <FileUpload.DropzoneContent>
                      <Box>
                        {isUploading
                          ? "Subiendo imágenes..."
                          : "Arrastrá y soltá archivos aquí"}
                      </Box>
                      <Box color="fg.muted">.png, .jpg up to 5MB</Box>
                    </FileUpload.DropzoneContent>
                  </FileUpload.Dropzone>
                </FileUpload.Root>
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>

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
    </Dialog.Root>
  );
}
