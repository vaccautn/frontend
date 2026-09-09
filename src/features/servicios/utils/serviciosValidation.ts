export type ServicioNuevoValues = {
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  observaciones: string;
};

export const initialServicioNuevoValues: ServicioNuevoValues = {
  nombre: "",
  fecha_inicio: "",
  fecha_fin: "",
  observaciones: "",
};

export type ServicioNuevoFieldErrors = Partial<
  Record<keyof ServicioNuevoValues, string>
>;

export function validateServicioNuevoForm(
  values: ServicioNuevoValues,
): ServicioNuevoFieldErrors {
  const errors: ServicioNuevoFieldErrors = {};

  if (!values.fecha_inicio) {
    errors.fecha_inicio = "La fecha de inicio es obligatoria.";
  }

  if (
    values.fecha_fin &&
    values.fecha_inicio &&
    values.fecha_fin < values.fecha_inicio
  ) {
    errors.fecha_fin = "La fecha de fin no puede ser anterior al inicio.";
  }

  return errors;
}

export type ServicioEditarValues = {
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  observaciones: string;
};

export type ServicioEditarFieldErrors = Partial<
  Record<keyof ServicioEditarValues, string>
>;

export function validateServicioEditarForm(
  values: ServicioEditarValues,
): ServicioEditarFieldErrors {
  const errors: ServicioEditarFieldErrors = {};

  if (!values.fecha_inicio) {
    errors.fecha_inicio = "La fecha de inicio es obligatoria.";
  }

  if (
    values.fecha_fin &&
    values.fecha_inicio &&
    values.fecha_fin < values.fecha_inicio
  ) {
    errors.fecha_fin = "La fecha de fin no puede ser anterior al inicio.";
  }

  if (!values.estado) {
    errors.estado = "El estado es obligatorio.";
  }

  return errors;
}
