import { useState } from "react";
import { Menu, Portal } from "@chakra-ui/react";
import {
  IconCheck,
  IconChevronDown,
  IconPencil,
  IconPhoto,
  IconX,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import { normalizeBackendDetail } from "@/features/auth";
import { DEFAULT_CC_SCALE } from "@/features/animales/constants";
import {
  getImagenesEvaluacion,
  updateEvaluacionCc,
} from "@/features/animales/services/animalesService";
import type { EvaluacionCC, EvidenciaImagenRead } from "@/features/animales/types";
import { ApiError } from "@/services/httpClient";
import { VerImagenesEvaluacionDialog } from "./VerImagenesEvaluacionDialog";

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

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
  const [isImagenesOpen, setIsImagenesOpen] = useState(false);
  const [imagenes, setImagenes] = useState<EvidenciaImagenRead[]>([]);
  const [imagenesLoading, setImagenesLoading] = useState(false);
  const [imagenesError, setImagenesError] = useState("");

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

  const openImagenes = async () => {
    setIsImagenesOpen(true);
    setImagenesLoading(true);
    setImagenesError("");
    try {
      const data = await getImagenesEvaluacion(evaluacion.id);
      setImagenes(data);
    } catch (error) {
      setImagenesError(
        error instanceof ApiError
          ? (normalizeBackendDetail(error.detail) ??
              "No pudimos cargar las imágenes de esta evaluación.")
          : "No pudimos cargar las imágenes de esta evaluación.",
      );
    } finally {
      setImagenesLoading(false);
    }
  };

  return (
    <article className="animal-evaluaciones__item">
      <div className="animal-evaluaciones__item-header">
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
            <strong>CC {String(evaluacion.valor_cc)}</strong>
            <button
              type="button"
              className="animal-evaluaciones__edit-trigger-btn"
              aria-label="Editar valor de CC"
              onClick={startEditing}>
              <IconPencil size={14} stroke={1.75} />
            </button>
          </div>
        )}
        <span>{DATE_TIME_FORMATTER.format(new Date(evaluacion.fecha))}</span>
      </div>
      <p className="animal-evaluaciones__meta">
        Escala {evaluacion.escala_min} a {evaluacion.escala_max}
      </p>
      <p>{evaluacion.observaciones?.trim() || "Sin observaciones."}</p>

      <div className="animal-evaluaciones__footer">
        <button
          type="button"
          className="animal-evaluaciones__imagenes-btn"
          onClick={openImagenes}>
          <IconPhoto size={14} stroke={1.75} />
          Ver imágenes
        </button>
      </div>

      <VerImagenesEvaluacionDialog
        evaluacion={evaluacion}
        open={isImagenesOpen}
        onClose={() => setIsImagenesOpen(false)}
        imagenes={imagenes}
        onImagenesChange={setImagenes}
        isLoading={imagenesLoading}
        loadError={imagenesError}
      />
    </article>
  );
}
