export function normalizeBackendDetail(detail: unknown): string {
  const raw = Array.isArray(detail)
    ? detail.map((e) => e?.msg ?? "Error de validación").join(", ")
    : typeof detail === "string"
      ? detail
      : "Ocurrió un error inesperado.";

  return raw
    .replaceAll("correo electronico", "correo electrónico")
    .replaceAll("contrasena", "contraseña")
    .replaceAll("Contrasena", "Contraseña")
    .replaceAll("confirmacion", "confirmación")
    .replaceAll("Confirmacion", "Confirmación")
    .replaceAll("mayuscula", "mayúscula")
    .replaceAll("minuscula", "minúscula")
    .replaceAll("numero", "número")
    .replaceAll("invalidas", "inválidas")
    .replaceAll("sesion", "sesión");
}
