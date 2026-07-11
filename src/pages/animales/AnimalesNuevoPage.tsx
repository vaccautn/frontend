import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Drawer,
  Field,
  Input,
  NativeSelect,
  Portal,
} from "@chakra-ui/react";
import { registerAnimal } from "@/features/animales/services/animalesService";
import { getLotes } from "@/features/lotes/services/lotesService";
import { ApiError } from "@/services/httpClient";
import {
  initialRodeoNuevoValues,
  validateRodeoNuevoForm,
  type RodeoNuevoFieldErrors,
  type RodeoNuevoValues,
} from "@/features/animales/utils/animalesValidation";
import { normalizeBackendDetail } from "@/features/auth";
import { RAZAS, SEXOS } from "@/features/animales/constants";
import type { LoteOption } from "@/features/lotes/types";
import { toast } from "react-toastify";

function AnimalesNuevoPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [values, setValues] = useState<RodeoNuevoValues>(
    initialRodeoNuevoValues,
  );
  const [errors, setErrors] = useState<RodeoNuevoFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lotes, setLotes] = useState<LoteOption[]>([]);
  const [lotesLoading, setLotesLoading] = useState(true);
  const [lotesError, setLotesError] = useState("");

  useEffect(() => {
    getLotes()
      .then(setLotes)
      .catch(() => setLotesError("No se pudieron cargar los lotes disponibles."))
      .finally(() => setLotesLoading(false));
  }, []);

  const close = (refresh = false) => {
    setOpen(false);
    setTimeout(() => navigate("/animales", { state: { refresh } }), 250);
  };

  const updateField =
    (field: keyof RodeoNuevoValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
      setFormError("");
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors = validateRodeoNuevoForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await registerAnimal({
        caravana: values.caravana.trim(),
        raza: values.raza,
        sexo: values.sexo,
        fecha_nacimiento: values.fecha_nacimiento,
        lote_id: Number(values.lote_id),
      });

      toast.success("Animal registrado correctamente.");
      close(true);
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(
          normalizeBackendDetail(error.detail) ??
            "Error al registrar el animal.",
        );
      } else {
        setFormError("No se pudo registrar el animal. Probá nuevamente.");
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
              <Drawer.Title>Registrar animal</Drawer.Title>
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
                id="animal-nuevo-form"
                onSubmit={handleSubmit}
                noValidate
                className="animal-form__fields">
                <Field.Root invalid={!!errors.caravana}>
                  <Field.Label>Caravana</Field.Label>
                  <Input
                    value={values.caravana}
                    onChange={updateField("caravana")}
                  />
                  <Field.ErrorText>{errors.caravana}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.raza}>
                  <Field.Label>Raza</Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      value={values.raza}
                      onChange={updateField("raza")}>
                      <option value="">Seleccioná una raza</option>
                      {RAZAS.map((raza) => (
                        <option key={raza} value={raza}>
                          {raza}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                  <Field.ErrorText>{errors.raza}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.sexo}>
                  <Field.Label>Sexo</Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      value={values.sexo}
                      onChange={updateField("sexo")}>
                      <option value="">Seleccioná el sexo</option>
                      {SEXOS.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                  <Field.ErrorText>{errors.sexo}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.fecha_nacimiento}>
                  <Field.Label>Fecha de nacimiento</Field.Label>
                  <Input
                    type="date"
                    value={values.fecha_nacimiento}
                    onChange={updateField("fecha_nacimiento")}
                  />
                  <Field.ErrorText>{errors.fecha_nacimiento}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.lote_id}>
                  <Field.Label>Lote</Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      value={values.lote_id}
                      onChange={updateField("lote_id")}>
                      <option value="">
                        {lotesLoading
                          ? "Cargando lotes..."
                          : "Selecciona un lote"}
                      </option>
                      {lotes.map((lote) => (
                        <option key={lote.id} value={lote.id}>
                          {lote.nombre}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                  <Field.ErrorText>{errors.lote_id}</Field.ErrorText>
                  {lotesError && <p className="status-message error">{lotesError}</p>}
                  {!lotesLoading && lotes.length === 0 && !lotesError && (
                    <p className="status-message error">
                      No tenes lotes disponibles para registrar animales.
                    </p>
                  )}
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
                form="animal-nuevo-form"
                colorPalette="brand"
                loading={isSubmitting}
                loadingText="Registrando...">
                Registrar animal
              </Button>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}

export default AnimalesNuevoPage;
