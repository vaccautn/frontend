import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  Button,
  Dialog,
  Field,
  Portal,
  Spinner,
  Textarea,
  Box,
  FileUpload,
  Icon,
  Menu,
} from "@chakra-ui/react";
import { IconChevronDown, IconPlus, IconX } from "@tabler/icons-react";
import { toast } from "react-toastify";
import { DEFAULT_CC_SCALE } from "@/features/animales/constants";
import {
  eliminarImagenEvaluacion,
  getImagenesEvaluacion,
  subirImagenesEvaluacion,
} from "@/features/animales/services/animalesService";
import type {
  Animal,
  EvaluacionCC,
  EvidenciaImagenRead,
} from "@/features/animales/types";
import { getImagenUploadErrorMessage } from "@/features/animales/utils/imagenUploadErrors";
import { localNaiveNow } from "@/utils/localDateTime";

export interface EvaluacionCCPendiente {
  valorCc: number;
  escalaMin: number;
  escalaMax: number;
  observaciones: string;
  fecha: string;
  files: File[];
}

type RegistrarEvaluacionCCDialogProps = {
  animal: Animal | null;
  open: boolean;
  evaluacionExistente?: EvaluacionCC | null;
  /** Fecha a usar para una evaluación nueva (p. ej. la fecha elegida para
   * simular carga histórica de una sesión). Si no se pasa, se usa "ahora". */
  fechaBase?: string;
  onClose: () => void;
  onGuardar: (data: EvaluacionCCPendiente) => Promise<boolean>;
};

type FormValues = {
  valorCc: string;
  observaciones: string;
};

type FormErrors = {
  valorCc?: string;
};

const INITIAL_VALUES: FormValues = {
  valorCc: "",
  observaciones: "",
};

export function RegistrarEvaluacionCCDialog({
  animal,
  open,
  evaluacionExistente,
  fechaBase,
  onClose,
  onGuardar,
}: RegistrarEvaluacionCCDialogProps) {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [imagenes, setImagenes] = useState<EvidenciaImagenRead[]>([]);
  const [imagenesLoading, setImagenesLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [confirmDeleteImage, setConfirmDeleteImage] =
    useState<EvidenciaImagenRead | null>(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [fullscreenImage, setFullscreenImage] =
    useState<EvidenciaImagenRead | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const scaleLabel = useMemo(
    () => `${DEFAULT_CC_SCALE.min} a ${DEFAULT_CC_SCALE.max}`,
    [],
  );

  const ccOptions = useMemo(() => {
    const opts: number[] = [];
    for (let i = DEFAULT_CC_SCALE.min; i <= DEFAULT_CC_SCALE.max; i++) {
      opts.push(i);
    }
    return opts;
  }, []);

  useEffect(() => {
    if (open && evaluacionExistente) {
      setValues({
        valorCc: String(evaluacionExistente.valor_cc),
        observaciones: evaluacionExistente.observaciones,
      });
    } else if (open) {
      setValues(INITIAL_VALUES);
    }
    setFiles([]);
    setErrors({});
    setFormError("");
    setIsSaving(false);
  }, [open, evaluacionExistente]);

  // Las evaluaciones ya persistidas manejan sus fotos contra el servidor
  // (subida/lectura inmediata), igual que en el historial del animal — así
  // el preview no depende de un array local que se pisa al cerrar el diálogo.
  useEffect(() => {
    if (!open || !evaluacionExistente) {
      setImagenes([]);
      return;
    }

    let isMounted = true;
    setImagenesLoading(true);

    getImagenesEvaluacion(evaluacionExistente.id)
      .then((data) => {
        if (isMounted) setImagenes(data);
      })
      .catch(() => {
        if (isMounted)
          toast.error("No pudimos cargar las imágenes de esta evaluación.");
      })
      .finally(() => {
        if (isMounted) setImagenesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, evaluacionExistente]);

  useEffect(() => {
    if (!fullscreenImage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreenImage(null);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenImage]);

  const handleAddImageClick = () => imageInputRef.current?.click();

  const handleImageInputChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const nuevosArchivos = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (nuevosArchivos.length === 0 || !evaluacionExistente) return;

    setIsUploadingImage(true);
    try {
      const nuevas = await subirImagenesEvaluacion(
        evaluacionExistente.id,
        nuevosArchivos,
      );
      setImagenes((current) => [...current, ...nuevas]);
      toast.success(
        nuevas.length > 1
          ? "Imágenes subidas correctamente."
          : "Imagen subida correctamente.",
      );
    } catch (error) {
      toast.error(getImagenUploadErrorMessage(error, nuevosArchivos.length));
    } finally {
      setIsUploadingImage(false);
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
    } catch {
      toast.error("No pudimos eliminar la imagen.");
    } finally {
      setIsDeletingImage(false);
    }
  };

  const updateField =
    (field: keyof FormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      if (field === "valorCc") {
        setErrors((current) => ({ ...current, valorCc: undefined }));
      }
      setFormError("");
    };

  const handleCcChange = (value: number) => {
    setValues((current) => ({ ...current, valorCc: String(value) }));
    setErrors((current) => ({ ...current, valorCc: undefined }));
    setFormError("");
  };

  const handleGuardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!animal || isSaving) return;

    if (animal.estado !== "ACTIVO") {
      setFormError(
        "No es posible registrar una evaluación porque el animal no se encuentra activo.",
      );
      return;
    }

    const nextErrors: FormErrors = {};
    const normalizedScore = values.valorCc.trim();

    if (!normalizedScore) {
      nextErrors.valorCc =
        "Debés ingresar un valor de condición corporal para registrar la evaluación.";
    } else {
      const parsedScore = Number(normalizedScore);
      if (
        Number.isNaN(parsedScore) ||
        !Number.isInteger(parsedScore) ||
        parsedScore < DEFAULT_CC_SCALE.min ||
        parsedScore > DEFAULT_CC_SCALE.max
      ) {
        nextErrors.valorCc = `El valor ingresado no pertenece a la escala configurada. Ingresá un número entero entre ${scaleLabel}.`;
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setFormError("");
    setIsSaving(true);
    const guardado = await onGuardar({
      valorCc: Number(normalizedScore),
      escalaMin: DEFAULT_CC_SCALE.min,
      escalaMax: DEFAULT_CC_SCALE.max,
      observaciones: values.observaciones.trim(),
      fecha: fechaBase ?? localNaiveNow(),
      files,
    });
    setIsSaving(false);

    if (guardado) {
      setFormError("");
      onClose();
    }
  };

  return (
    <>
      <Dialog.Root
        open={open}
        onOpenChange={(details) => !details.open && !isSaving && onClose()}>
        <Portal>
          <Dialog.Backdrop className="animal-evaluacion__backdrop" />
          <Dialog.Positioner>
          <Dialog.Content className="animal-evaluacion__dialog">
            <Dialog.Header className="animal-evaluacion__header">
              <div>
                {animal && (
                  <Dialog.Title>
                    Registrar evaluación de CC de {animal.caravana}
                  </Dialog.Title>
                )}
                <p>Escala 1 a 5</p>
              </div>
              <Dialog.CloseTrigger asChild>
                <button
                  type="button"
                  className="animal-form__close"
                  aria-label="Cerrar"
                  disabled={isSaving}>
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

              <form
                id="animal-evaluacion-form"
                onSubmit={handleGuardar}
                noValidate
                className="animal-form__fields">
                <Field.Root invalid={!!errors.valorCc} required>
                  <Field.Label>Condición corporal</Field.Label>
                  <Menu.Root>
                    <Menu.Trigger asChild>
                      <button
                        type="button"
                        className="animal-evaluacion__valor-trigger"
                        aria-label="Seleccionar valor de CC">
                        <span>{values.valorCc || "Seleccioná un valor"}</span>
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
                          {ccOptions.map((option) => (
                            <Menu.Item
                              key={option}
                              value={String(option)}
                              onSelect={() => handleCcChange(option)}>
                              {option}
                            </Menu.Item>
                          ))}
                        </Menu.Content>
                      </Menu.Positioner>
                    </Portal>
                  </Menu.Root>
                  <Field.ErrorText>{errors.valorCc}</Field.ErrorText>
                </Field.Root>

                <Field.Root>
                  <Field.Label>Observación</Field.Label>
                  <Textarea
                    value={values.observaciones}
                    onChange={updateField("observaciones")}
                    rows={2}
                    placeholder="Agregá una observación si hace falta."
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Imágenes</Field.Label>
                  {evaluacionExistente ? (
                    <>
                      {imagenesLoading ? (
                        <div className="animal-imagenes__loading">
                          <Spinner size="xs" />
                          <span>Cargando imágenes...</span>
                        </div>
                      ) : (
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
                            disabled={isUploadingImage}>
                            {isUploadingImage ? (
                              <Spinner size="xs" />
                            ) : (
                              <IconPlus size={20} stroke={1.75} />
                            )}
                          </button>
                        </div>
                      )}
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={handleImageInputChange}
                      />
                    </>
                  ) : (
                    <FileUpload.Root
                      alignItems="stretch"
                      maxFiles={10}
                      onFileChange={(details) =>
                        setFiles(details.acceptedFiles)
                      }>
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
                          <Box>Arrastrá y soltá archivos aquí</Box>
                          <Box color="fg.muted">.png, .jpg up to 5MB</Box>
                        </FileUpload.DropzoneContent>
                      </FileUpload.Dropzone>
                      <FileUpload.ItemGroup>
                        <FileUpload.Context>
                          {({ acceptedFiles }) =>
                            acceptedFiles.map((file) => (
                              <FileUpload.Item key={file.name} file={file}>
                                <div>
                                  <FileUpload.ItemPreview>
                                    <FileUpload.ItemPreviewImage
                                      boxSize="48px"
                                      objectFit="cover"
                                      borderRadius="md"
                                    />
                                  </FileUpload.ItemPreview>
                                  <div className="align-baseline">
                                    <FileUpload.ItemName />
                                    <FileUpload.ItemSizeText />
                                  </div>
                                </div>

                                <FileUpload.ItemDeleteTrigger
                                  asChild
                                  className="delete-file">
                                  <svg
                                    className="upload-icon"
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24px"
                                    viewBox="0 -960 960 960"
                                    width="24px"
                                    fill="#888">
                                    <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                                  </svg>
                                </FileUpload.ItemDeleteTrigger>
                              </FileUpload.Item>
                            ))
                          }
                        </FileUpload.Context>
                      </FileUpload.ItemGroup>
                    </FileUpload.Root>
                  )}
                </Field.Root>
              </form>
            </Dialog.Body>
            <div className="info-de-fecha">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3">
                <path d="M440-280h80v-240h-80v240Zm68.5-331.5Q520-623 520-640t-11.5-28.5Q497-680 480-680t-28.5 11.5Q440-657 440-640t11.5 28.5Q463-600 480-600t28.5-11.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
              </svg>
              <p>La fecha y hora se registran automáticamente al guardar</p>
            </div>
            <Dialog.Footer className="animal-evaluacion__footer">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving}>
                Cancelar
              </Button>
              <Button
                type="submit"
                form="animal-evaluacion-form"
                colorPalette="brand"
                loading={isSaving}
                loadingText="Guardando..."
                disabled={!animal || animal.estado !== "ACTIVO"}>
                Guardar valor
              </Button>
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
    </>
  );
}
