import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Dialog, Menu, Portal, Spinner } from "@chakra-ui/react";
import { IconPencil, IconPhoto, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import type { EvaluacionCC, EvidenciaImagenRead } from "@/features/animales/types";
import {
  eliminarImagenEvaluacion,
  getImagenesEvaluacion,
  subirImagenesEvaluacion,
} from "@/features/animales/services/animalesService";
import { getAnimalRfidLabel } from "@/features/animales/utils/animalRfid";
import { formatEventDateTime } from "@/utils/localDateTime";

type SesionEvaluacionRowProps = {
  evaluacion: EvaluacionCC;
  onEdit: () => void;
  onDelete: () => void;
};

export function SesionEvaluacionRow({ evaluacion, onEdit, onDelete }: SesionEvaluacionRowProps) {
  const animalRfid = getAnimalRfidLabel(evaluacion.animal_rfid);
  const animalAccessibleName =
    animalRfid === "Sin RFID" ? "animal sin RFID" : `animal con RFID ${animalRfid}`;

  const [imagenesOpen, setImagenesOpen] = useState(false);
  const [imagenes, setImagenes] = useState<EvidenciaImagenRead[]>([]);
  const [imagenesLoaded, setImagenesLoaded] = useState(false);
  const [imagenesLoading, setImagenesLoading] = useState(false);
  const [imagenesError, setImagenesError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<EvidenciaImagenRead | null>(null);
  const [confirmDeleteImage, setConfirmDeleteImage] = useState<EvidenciaImagenRead | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carga las fotos de la evaluación (animal + sesión) apenas se monta la fila,
  // para saber si corresponde mostrar el ícono de "tiene fotos".
  useEffect(() => {
    let isMounted = true;

    void Promise.resolve().then(async () => {
      if (!isMounted) return;
      setImagenesLoading(true);
      setImagenesError("");

      try {
        const data = await getImagenesEvaluacion(evaluacion.id);
        if (!isMounted) return;
        setImagenes(data);
        setImagenesLoaded(true);
      } catch {
        if (isMounted) setImagenesError("No pudimos cargar las fotos de esta evaluación.");
      } finally {
        if (isMounted) setImagenesLoading(false);
      }
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

  const handleAddImageClick = () => fileInputRef.current?.click();

  const handleFileInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const nuevas = await subirImagenesEvaluacion(evaluacion.id, files);
      setImagenes((current) => [...current, ...nuevas]);
    } catch {
      setImagenesError("No pudimos subir una o más fotos.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImageConfirmed = async () => {
    if (!confirmDeleteImage) return;

    const imagen = confirmDeleteImage;
    setIsDeleting(true);
    try {
      await eliminarImagenEvaluacion(imagen.id);
      setImagenes((current) => current.filter((item) => item.id !== imagen.id));
      setConfirmDeleteImage(null);
    } catch {
      setImagenesError("No pudimos eliminar la foto.");
    } finally {
      setIsDeleting(false);
    }
  };

  const tieneFotos = imagenesLoaded && imagenes.length > 0;

  return (
    <tr
      className="sesion-evaluacion-row"
      tabIndex={0}
      aria-label={`Ver fotos del ${animalAccessibleName}`}
      onClick={() => setImagenesOpen(true)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setImagenesOpen(true);
        }
      }}>
      <td className="sesion-evaluacion-row__toggle-cell">
        {tieneFotos && (
          <span className="sesion-evaluacion-row__photo-indicator" aria-hidden="true">
            <IconPhoto size={16} stroke={1.5} />
          </span>
        )}
      </td>
      <td className="sesion-evaluacion-row__animal">{animalRfid}</td>
      <td>
        <span
          className={`sesion-evaluacion-row__badge sesion-evaluacion-row__badge--cc-${evaluacion.valor_cc}`}
          aria-label={`Condición corporal ${evaluacion.valor_cc}`}>
          CC {evaluacion.valor_cc}
        </span>
      </td>
      <td className="sesion-evaluacion-row__observaciones">
        {evaluacion.observaciones?.trim() || "Sin observaciones."}
      </td>
      <td className="sesion-evaluacion-row__hora">{formatEventDateTime(evaluacion.fecha)}</td>
      <td className="sesion-evaluacion-row__acciones">
        <span className="sesion-evaluacion-row__acciones-inner">
          <button
            type="button"
            className="sesion-evaluacion-row__action"
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            aria-label={`Editar evaluación del ${animalAccessibleName}`}>
            <IconPencil size={16} stroke={1.5} />
          </button>
          <button
            type="button"
            className="sesion-evaluacion-row__action sesion-evaluacion-row__action--danger"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            aria-label={`Eliminar evaluación del ${animalAccessibleName}`}>
            <IconTrash size={16} stroke={1.5} />
          </button>
        </span>
      </td>

      <Dialog.Root
        open={imagenesOpen}
        onOpenChange={(details) => setImagenesOpen(details.open)}>
        <Portal>
          <Dialog.Backdrop className="animal-evaluacion__backdrop" />
          <Dialog.Positioner>
            <Dialog.Content className="sesion-evaluacion-popup">
              <Dialog.Header className="sesion-evaluacion-popup__header">
                <div>
                  <Dialog.Title>Fotos — {animalRfid}</Dialog.Title>
                  <p className="sesion-evaluacion-popup__subtitle">
                    CC {evaluacion.valor_cc} · {formatEventDateTime(evaluacion.fecha)}
                  </p>
                </div>
              </Dialog.Header>

              <Dialog.Body>
                {imagenesLoading && (
                  <div className="animal-imagenes__loading">
                    <Spinner size="xs" />
                    <span>Cargando fotos...</span>
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
                            aria-label="Ver foto en pantalla completa (click derecho para eliminar)"
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
                                Eliminar foto
                              </Menu.Item>
                            </Menu.Content>
                          </Menu.Positioner>
                        </Portal>
                      </Menu.Root>
                    ))}

                    <button
                      type="button"
                      className="animal-imagenes__add-thumb"
                      aria-label="Agregar foto"
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
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {fullscreenImage && (
        <Portal>
          <div className="animal-imagenes__lightbox" onClick={() => setFullscreenImage(null)}>
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
                <p>¿Estás seguro de que querés eliminar esta foto?</p>
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
                    onClick={handleDeleteImageConfirmed}
                    disabled={isDeleting}>
                    {isDeleting ? <Spinner size="xs" /> : "Eliminar"}
                  </button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </tr>
  );
}
