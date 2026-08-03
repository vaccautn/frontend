import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Drawer,
  Field,
  Input,
  NativeSelect,
  Portal,
  Textarea,
} from "@chakra-ui/react";
import { IconArrowNarrowLeft, IconPlus } from "@tabler/icons-react";
import { registerAnimal } from "@/features/animales/services/animalesService";
import { getLotes, createLote } from "@/features/lotes/services/lotesService";
import { ApiError } from "@/services/httpClient";
import {
  initialRodeoNuevoValues,
  validateRodeoNuevoForm,
  type RodeoNuevoFieldErrors,
  type RodeoNuevoValues,
} from "@/features/animales/utils/animalesValidation";
import { normalizeBackendDetail, useAuth } from "@/features/auth";
import { RAZAS, SEXOS } from "@/features/animales/constants";
import type { LoteOption } from "@/features/lotes/types";
import { toast } from "react-toastify";

function AnimalesNuevoPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const [isCreatingLote, setIsCreatingLote] = useState(false);
  const [nuevoLoteNombre, setNuevoLoteNombre] = useState("");
  const [nuevoLoteDescripcion, setNuevoLoteDescripcion] = useState("");
  const [nuevoLoteError, setNuevoLoteError] = useState("");

  useEffect(() => {
    getLotes()
      .then(setLotes)
      .catch(() =>
        setLotesError("No se pudieron cargar los lotes disponibles."),
      )
      .finally(() => setLotesLoading(false));
  }, []);

  useEffect(() => {
    if (!lotesLoading && !lotesError && lotes.length === 0) {
      setIsCreatingLote(true);
    }
  }, [lotesLoading, lotesError, lotes.length]);

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

  const toggleCreatingLote = () => {
    setIsCreatingLote((current) => !current);
    setNuevoLoteError("");
    setErrors((current) => ({ ...current, lote_id: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setNuevoLoteError("");

    const nextErrors = validateRodeoNuevoForm(values);
    if (isCreatingLote) {
      delete nextErrors.lote_id;
    }
    setErrors(nextErrors);

    if (isCreatingLote && !nuevoLoteNombre.trim()) {
      setNuevoLoteError("El nombre del lote es obligatorio.");
      return;
    }
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      let loteId: number;

      if (isCreatingLote) {
        const nuevoLote = await createLote({
          nombre: nuevoLoteNombre.trim(),
          descripcion: nuevoLoteDescripcion.trim(),
          usuario_administrador_id: user?.id ?? 0,
          activo: true,
        });
        loteId = nuevoLote.id;
      } else {
        loteId = Number(values.lote_id);
      }

      await registerAnimal({
        caravana: values.caravana.trim(),
        raza: values.raza,
        sexo: values.sexo,
        fecha_nacimiento: values.fecha_nacimiento,
        lote_id: loteId,
      });

      toast.success(
        isCreatingLote
          ? "Lote y animal registrados correctamente."
          : "Animal registrado correctamente.",
      );
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

                {!isCreatingLote && (
                  <Field.Root invalid={!!errors.lote_id}>
                    <Field.Label className="label_button">
                      Lote
                      <div className="animal-form__lote-toggle">
                        <IconPlus stroke={1.5} />
                        <button
                          type="button"
                          className="animal-form__link-button"
                          onClick={toggleCreatingLote}>
                          {isCreatingLote
                            ? "Usar lote existente"
                            : "Crear nuevo lote"}
                        </button>
                      </div>
                    </Field.Label>
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
                    {lotesError && (
                      <p className="status-message error">{lotesError}</p>
                    )}
                  </Field.Root>
                )}

                {isCreatingLote && (
                  <>
                    <Field.Root invalid={!!nuevoLoteError}>
                      <Field.Label className="label_button">
                        Nombre del lote
                        <div className="animal-form__lote-toggle">
                          <IconArrowNarrowLeft stroke={1.5} />
                          <button
                            type="button"
                            className="animal-form__link-button"
                            onClick={toggleCreatingLote}>
                            {isCreatingLote
                              ? "Usar lote existente"
                              : "Crear nuevo lote"}
                          </button>
                        </div>
                      </Field.Label>
                      <Input
                        value={nuevoLoteNombre}
                        onChange={(event) => {
                          setNuevoLoteNombre(event.target.value);
                          setNuevoLoteError("");
                        }}
                      />
                      <Field.ErrorText>{nuevoLoteError}</Field.ErrorText>
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>Descripción del lote</Field.Label>
                      <Textarea
                        value={nuevoLoteDescripcion}
                        onChange={(event) =>
                          setNuevoLoteDescripcion(event.target.value)
                        }
                        rows={2}
                      />
                    </Field.Root>
                  </>
                )}

                {!lotesLoading &&
                  lotes.length === 0 &&
                  !lotesError &&
                  !isCreatingLote && (
                    <p className="status-message error">
                      No tenes lotes disponibles para registrar animales.
                    </p>
                  )}
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
