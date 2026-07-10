import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  Button,
  Dialog,
  Field,
  Portal,
  Textarea,
  Box,
  FileUpload,
  Icon,
  RadioCard,
  HStack,
} from "@chakra-ui/react";
import { toast } from "react-toastify";
import { normalizeBackendDetail } from "@/features/auth";
import { DEFAULT_CC_SCALE } from "@/features/animales/constants";
import { registerEvaluacionCc } from "@/features/animales/services/animalesService";
import type { Animal } from "@/features/animales/types";
import { ApiError } from "@/services/httpClient";

type RegistrarEvaluacionCCDialogProps = {
  animal: Animal | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
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
  onClose,
  onSuccess,
}: RegistrarEvaluacionCCDialogProps) {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scaleLabel = useMemo(
    () => `${DEFAULT_CC_SCALE.min} a ${DEFAULT_CC_SCALE.max}`,
    [],
  );

  const ccOptions = useMemo(() => {
    const opts: { value: string; title: string }[] = [];
    for (let i = DEFAULT_CC_SCALE.min; i <= DEFAULT_CC_SCALE.max; i++) {
      opts.push({ value: String(i), title: String(i) });
    }
    return opts;
  }, []);

  const updateField =
    (field: keyof FormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      if (field === "valorCc") {
        setErrors((current) => ({ ...current, valorCc: undefined }));
      }
      setFormError("");
    };

  const handleCcChange = (value: string | null) => {
    setValues((current) => ({ ...current, valorCc: value ?? "" }));
    setErrors((current) => ({ ...current, valorCc: undefined }));
    setFormError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting || !animal) return;

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

    setIsSubmitting(true);
    try {
      await registerEvaluacionCc({
        animal_id: animal.id,
        valor_cc: Number(normalizedScore),
        escala_min: DEFAULT_CC_SCALE.min,
        escala_max: DEFAULT_CC_SCALE.max,
        observaciones: values.observaciones.trim(),
      });

      await onSuccess();
      toast.success(
        "Evaluación de condición corporal registrada correctamente.",
      );
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(
          normalizeBackendDetail(error.detail) ??
            "No pudimos registrar la evaluación en este momento. Revisá tu conexión o intentá nuevamente. Los datos ingresados no se perdieron.",
        );
      } else {
        setFormError(
          "No pudimos registrar la evaluación en este momento. Revisá tu conexión o intentá nuevamente. Los datos ingresados no se perdieron.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => !details.open && onClose()}>
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
                  aria-label="Cerrar">
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
                onSubmit={handleSubmit}
                noValidate
                className="animal-form__fields">
                <Field.Root invalid={!!errors.valorCc} required>
                  <Field.Label>Valor de CC</Field.Label>
                  <RadioCard.Root
                    value={values.valorCc || null}
                    onValueChange={(e) => handleCcChange(e.value)}>
                    <HStack align="stretch">
                      {ccOptions.map((item) => (
                        <RadioCard.Item key={item.value} value={item.value}>
                          <RadioCard.ItemHiddenInput />
                          <RadioCard.ItemControl>
                            <RadioCard.ItemText>
                              {item.title}
                            </RadioCard.ItemText>
                            <RadioCard.ItemIndicator className="radio" />
                          </RadioCard.ItemControl>
                        </RadioCard.Item>
                      ))}
                    </HStack>
                  </RadioCard.Root>
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
                <FileUpload.Root alignItems="stretch" maxFiles={10}>
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
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                form="animal-evaluacion-form"
                colorPalette="brand"
                loading={isSubmitting}
                loadingText="Registrando..."
                disabled={!animal || animal.estado !== "ACTIVO"}>
                Registrar evaluación
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
