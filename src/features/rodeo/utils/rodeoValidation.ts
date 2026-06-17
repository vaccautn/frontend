export type RodeoNuevoValues = {
  caravana: string; // era id_caravana
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
