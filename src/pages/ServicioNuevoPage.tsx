import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Drawer,
  Field,
  Input,
  Portal,
  Textarea,
} from "@chakra-ui/react";
import {
  asociarLoteServicio,
  crearServicio,
} from "@/features/servicios/services/serviciosService";
import { getLotes } from "@/features/lotes/services/lotesService";
import type { LoteOption } from "@/features/lotes/types";
import { CATEGORIA_ANIMAL_LABELS } from "@/features/animales/constants";
import { ApiError } from "@/services/httpClient";
import {
  initialServicioNuevoValues,
  validateServicioNuevoForm,
  type ServicioNuevoFieldErrors,
  type ServicioNuevoValues,
} from "@/features/servicios/utils/serviciosValidation";
import { normalizeBackendDetail } from "@/features/auth";
import { toast } from "react-toastify";
import "@/features/servicios/components/servicios.css";

function ServicioNuevoPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [values, setValues] = useState<ServicioNuevoValues>(
    initialServicioNuevoValues,
  );
  const [errors, setErrors] = useState<ServicioNuevoFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lotes, setLotes] = useState<LoteOption[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(true);
  const [loteIdsSeleccionados, setLoteIdsSeleccionados] = useState<number[]>(
    [],
  );

  useEffect(() => {
    getLotes()
      .then(setLotes)
      .finally(() => setLoadingLotes(false));
  }, []);

  const toggleLote = (loteId: number) => {
    setLoteIdsSeleccionados((current) =>
      current.includes(loteId)
        ? current.filter((id) => id !== loteId)
        : [...current, loteId],
    );
  };

  const close = (refresh = false, servicioId?: number) => {
    setOpen(false);
    const path = servicioId ? `/servicios/${servicioId}` : "/servicios";
    setTimeout(() => navigate(path, { state: { refresh } }), 250);
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
      const nuevoServicio = await crearServicio({
        nombre: values.nombre.trim(),
        fecha_inicio: values.fecha_inicio,
        ...(values.fecha_fin ? { fecha_fin: values.fecha_fin } : {}),
        observaciones: values.observaciones.trim(),
      });

      if (loteIdsSeleccionados.length > 0) {
        const resultados = await Promise.allSettled(
          loteIdsSeleccionados.map((loteId) =>
            asociarLoteServicio(nuevoServicio.id, loteId),
          ),
        );
        const fallidos = resultados.filter((r) => r.status === "rejected").length;
        if (fallidos > 0) {
          toast.error(
            `Servicio creado, pero no se pudieron asociar ${fallidos} lote(s). Podés asociarlos desde el detalle.`,
          );
        }
      }

      toast.success("Servicio creado correctamente.");
      close(true, nuevoServicio.id);
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

                <Field.Root>
                  <Field.Label>
                    Lotes asociados (opcional)
                    {loteIdsSeleccionados.length > 0 &&
                      ` — ${loteIdsSeleccionados.length} seleccionado(s)`}
                  </Field.Label>
                  {loadingLotes ? (
                    <p className="servicio-form__lotes-vacio">Cargando lotes...</p>
                  ) : lotes.length === 0 ? (
                    <p className="servicio-form__lotes-vacio">
                      No hay lotes disponibles para asociar.
                    </p>
                  ) : (
                    <ul className="servicio-form__lotes-lista">
                      {lotes.map((lote) => (
                        <li key={lote.id}>
                          <label className="servicio-form__lote-item">
                            <input
                              type="checkbox"
                              checked={loteIdsSeleccionados.includes(lote.id)}
                              onChange={() => toggleLote(lote.id)}
                            />
                            <span>{lote.nombre}</span>
                            <span className="servicio-form__lote-categoria">
                              {CATEGORIA_ANIMAL_LABELS[lote.categoria] ??
                                lote.categoria}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
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
