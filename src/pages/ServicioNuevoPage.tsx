import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Drawer,
  Field,
  Input,
  Portal,
  Textarea,
} from "@chakra-ui/react";
import { crearServicio } from "@/features/servicios/services/serviciosService";
import { ApiError } from "@/services/httpClient";
import {
  initialServicioNuevoValues,
  validateServicioNuevoForm,
  type ServicioNuevoFieldErrors,
  type ServicioNuevoValues,
} from "@/features/servicios/utils/serviciosValidation";
import { normalizeBackendDetail } from "@/features/auth";
import { toast } from "react-toastify";

function ServicioNuevoPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [values, setValues] = useState<ServicioNuevoValues>(
    initialServicioNuevoValues,
  );
  const [errors, setErrors] = useState<ServicioNuevoFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const close = (refresh = false) => {
    setOpen(false);
    setTimeout(() => navigate("/servicios", { state: { refresh } }), 250);
  };

  const updateField =
    (field: keyof ServicioNuevoValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
      setFormError("");
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors = validateServicioNuevoForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await crearServicio({
        nombre: values.nombre.trim(),
        fecha_inicio: values.fecha_inicio,
        ...(values.fecha_fin ? { fecha_fin: values.fecha_fin } : {}),
        observaciones: values.observaciones.trim(),
      });

      toast.success("Servicio creado correctamente.");
      close(true);
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(
          normalizeBackendDetail(error.detail) ??
            "Error al crear el servicio.",
        );
      } else {
        setFormError("No se pudo crear el servicio. Probá nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) close();
      }}
      placement="end"
      size="md">
      <Portal>
        <Drawer.Backdrop className="animal-form__backdrop" />
        <Drawer.Positioner>
          <Drawer.Content className="animal-form">
            <Drawer.Header className="animal-form__header">
              <Drawer.Title>Crear servicio</Drawer.Title>
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
              {formError && (
                <p className="status-message error" role="alert">
                  {formError}
                </p>
              )}

              <form
                id="servicio-nuevo-form"
                onSubmit={handleSubmit}
                noValidate
                className="animal-form__fields">
                <Field.Root invalid={!!errors.nombre}>
                  <Field.Label>Nombre</Field.Label>
                  <Input
                    placeholder="Ej: Servicio Primavera 2026"
                    value={values.nombre}
                    onChange={updateField("nombre")}
                  />
                  <Field.ErrorText>{errors.nombre}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.fecha_inicio}>
                  <Field.Label>Fecha de inicio</Field.Label>
                  <Input
                    type="date"
                    value={values.fecha_inicio}
                    onChange={updateField("fecha_inicio")}
                  />
                  <Field.ErrorText>{errors.fecha_inicio}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.fecha_fin}>
                  <Field.Label>Fecha de fin (opcional)</Field.Label>
                  <Input
                    type="date"
                    value={values.fecha_fin}
                    onChange={updateField("fecha_fin")}
                  />
                  <Field.ErrorText>{errors.fecha_fin}</Field.ErrorText>
                </Field.Root>

                <Field.Root>
                  <Field.Label>Observaciones</Field.Label>
                  <Textarea
                    value={values.observaciones}
                    onChange={updateField("observaciones")}
                    rows={3}
                  />
                </Field.Root>
              </form>
            </Drawer.Body>

            <Drawer.Footer className="animal-form__footer">
              <Button
                type="button"
                variant="outline"
                className="animal-form__cancel"
                onClick={() => close()}>
                Cancelar
              </Button>
              <Button
                type="submit"
                form="servicio-nuevo-form"
                colorPalette="brand"
                loading={isSubmitting}
                loadingText="Creando...">
                Crear servicio
              </Button>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}

export default ServicioNuevoPage;
