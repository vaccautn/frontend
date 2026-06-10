export function normalizeBackendDetail(detail: string) {
  return detail
    .replaceAll('correo electronico', 'correo electrónico')
    .replaceAll('contrasena', 'contraseña')
    .replaceAll('Contrasena', 'Contraseña')
    .replaceAll('confirmacion', 'confirmación')
    .replaceAll('Confirmacion', 'Confirmación')
    .replaceAll('mayuscula', 'mayúscula')
    .replaceAll('minuscula', 'minúscula')
    .replaceAll('numero', 'número')
    .replaceAll('invalidas', 'inválidas')
    .replaceAll('sesion', 'sesión')
}
