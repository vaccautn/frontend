import {
  MENSAJE_FORMATO_CARAVANA,
  esCaravanaValida,
  normalizarCaravana,
} from "@/features/animales/utils/caravana";

export type RodeoNuevoValues = {
  caravana: string;
  raza: string;
  categoria: string;
  fecha_nacimiento: string;
  lote_id: string;
};

export const initialRodeoNuevoValues: RodeoNuevoValues = {
  caravana: "",
  raza: "",
  categoria: "",
  fecha_nacimiento: "",
  lote_id: "",
};

export type RodeoNuevoFieldErrors = Partial<
  Record<keyof RodeoNuevoValues, string>
>;

export function validateRodeoNuevoForm(
  values: RodeoNuevoValues,
): RodeoNuevoFieldErrors {
  const errors: RodeoNuevoFieldErrors = {};

  const errorCaravana = validarCaravana(values.caravana);
  if (errorCaravana) {
    errors.caravana = errorCaravana;
  }

  if (!values.raza.trim()) {
    errors.raza = "La raza es obligatoria.";
  }

  if (!values.categoria) {
    errors.categoria = "La categoría es obligatoria.";
  }

  if (!values.fecha_nacimiento) {
    errors.fecha_nacimiento = "La fecha de nacimiento es obligatoria.";
  }

  if (!values.lote_id) {
    errors.lote_id = "Debes elegir un lote.";
  }

  return errors;
}

export type RodeoEditarValues = {
  caravana: string;
  raza: string;
  categoria: string;
  fecha_nacimiento: string;
  estado: string;
  observacion: string;
  lote_id: string; // string para el input, se convierte a number | null al enviar
};

export const initialRodeoEditarValues: RodeoEditarValues = {
  caravana: "",
  raza: "",
  categoria: "",
  fecha_nacimiento: "",
  estado: "",
  observacion: "",
  lote_id: "",
};

export type RodeoEditarFieldErrors = Partial<
  Record<keyof RodeoEditarValues, string>
>;

/** `caravanaOriginal`: el formato SENASA se exige solo si la caravana cambia,
 * así se pueden seguir editando los animales cargados antes de exigirlo. */
export function validateRodeoEditarForm(
  values: RodeoEditarValues,
  caravanaOriginal = "",
): RodeoEditarFieldErrors {
  const errors: RodeoEditarFieldErrors = {};

  const cambioCaravana =
    normalizarCaravana(values.caravana) !== normalizarCaravana(caravanaOriginal);
  const errorCaravana = values.caravana.trim()
    ? cambioCaravana
      ? validarCaravana(values.caravana)
      : null
    : "El ID de caravana es obligatorio.";
  if (errorCaravana) {
    errors.caravana = errorCaravana;
  }

  if (!values.raza.trim()) {
    errors.raza = "La raza es obligatoria.";
  }

  if (!values.categoria) {
    errors.categoria = "La categoría es obligatoria.";
  }

  if (!values.fecha_nacimiento) {
    errors.fecha_nacimiento = "La fecha de nacimiento es obligatoria.";
  } else {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaNac = new Date(values.fecha_nacimiento);
    if (fechaNac > hoy) {
      errors.fecha_nacimiento = "La fecha de nacimiento no puede ser futura.";
    }
  }

  if (!values.estado) {
    errors.estado = "El estado es obligatorio.";
  }

  if (!values.lote_id) {
    errors.lote_id = "Debes elegir un lote.";
  }

  return errors;
}

function validarCaravana(valor: string): string | null {
  if (!valor.trim()) return "El ID de caravana es obligatorio.";
  return esCaravanaValida(normalizarCaravana(valor)) ? null : MENSAJE_FORMATO_CARAVANA;
}
