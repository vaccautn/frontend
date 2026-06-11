export type RodeoNuevoValues = {
  id_caravana: string;
  raza: string;
  sexo: string;
  fecha_nacimiento: string;
};

export type RodeoNuevoFieldErrors = Partial<
  Record<keyof RodeoNuevoValues, string>
>;

export const initialRodeoNuevoValues: RodeoNuevoValues = {
  id_caravana: "",
  raza: "",
  sexo: "",
  fecha_nacimiento: "",
};

export function validateRodeoNuevoForm(
  values: RodeoNuevoValues,
): RodeoNuevoFieldErrors {
  const errors: RodeoNuevoFieldErrors = {};

  if (!values.id_caravana.trim()) {
    errors.id_caravana = "El ID de caravana es obligatorio.";
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
