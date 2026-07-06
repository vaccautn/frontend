export type RodeoNuevoValues = {
  caravana: string;
  raza: string;
  sexo: string;
  fecha_nacimiento: string;
};

export const initialRodeoNuevoValues: RodeoNuevoValues = {
  caravana: "",
  raza: "",
  sexo: "",
  fecha_nacimiento: "",
};

export type RodeoNuevoFieldErrors = Partial<
  Record<keyof RodeoNuevoValues, string>
>;

export function validateRodeoNuevoForm(
  values: RodeoNuevoValues,
): RodeoNuevoFieldErrors {
  const errors: RodeoNuevoFieldErrors = {};

  if (!values.caravana.trim()) {
    errors.caravana = "El ID de caravana es obligatorio.";
  }

  if (!values.raza.trim()) {
    errors.raza = "La raza es obligatoria.";
  }

  if (!values.sexo) {
    errors.sexo = "El sexo es obligatorio.";
  }

  if (!values.fecha_nacimiento) {
    errors.fecha_nacimiento = "La fecha de nacimiento es obligatoria.";
  }

  return errors;
}

export type RodeoEditarValues = {
  caravana: string;
  raza: string;
  sexo: string;
  fecha_nacimiento: string;
  estado: string;
  observacion: string;
  lote_id: string; // string para el input, se convierte a number | null al enviar
};

export const initialRodeoEditarValues: RodeoEditarValues = {
  caravana: "",
  raza: "",
  sexo: "",
  fecha_nacimiento: "",
  estado: "",
  observacion: "",
  lote_id: "",
};

export type RodeoEditarFieldErrors = Partial<
  Record<keyof RodeoEditarValues, string>
>;

export function validateRodeoEditarForm(
  values: RodeoEditarValues,
): RodeoEditarFieldErrors {
  const errors: RodeoEditarFieldErrors = {};

  if (!values.caravana.trim()) {
    errors.caravana = "El ID de caravana es obligatorio.";
  }

  if (!values.raza.trim()) {
    errors.raza = "La raza es obligatoria.";
  }

  if (!values.sexo) {
    errors.sexo = "El sexo es obligatorio.";
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

  return errors;
}
