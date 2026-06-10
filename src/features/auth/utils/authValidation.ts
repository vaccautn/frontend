import { normalizeBackendDetail } from './authMessages'

export type RegisterValues = {
  nombre: string
  apellido: string
  email: string
  password: string
  confirmacion_password: string
}

export type LoginValues = {
  email: string
  password: string
}

export type RegisterFieldErrors = Partial<Record<keyof RegisterValues, string>>
export type LoginFieldErrors = Partial<Record<keyof LoginValues, string>>

export const initialRegisterValues: RegisterValues = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  confirmacion_password: '',
}

export const initialLoginValues: LoginValues = {
  email: '',
  password: '',
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validatePassword(password: string) {
  if (!password) {
    return 'La contraseña es obligatoria.'
  }

  if (password.length < 8) {
    return 'La contraseña tiene que tener al menos 8 caracteres.'
  }

  if (!/[A-Z]/.test(password)) {
    return 'La contraseña tiene que incluir una mayúscula.'
  }

  if (!/[a-z]/.test(password)) {
    return 'La contraseña tiene que incluir una minúscula.'
  }

  if (!/\d/.test(password)) {
    return 'La contraseña tiene que incluir un número.'
  }

  return ''
}

export function validateRegisterForm(
  values: RegisterValues,
): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {}

  if (!values.nombre.trim()) {
    errors.nombre = 'El nombre es obligatorio.'
  }

  if (!values.apellido.trim()) {
    errors.apellido = 'El apellido es obligatorio.'
  }

  if (!values.email.trim()) {
    errors.email = 'El correo electrónico es obligatorio.'
  } else if (!emailPattern.test(values.email)) {
    errors.email = 'Ingresá un correo electrónico válido.'
  }

  const passwordError = validatePassword(values.password)
  if (passwordError) {
    errors.password = passwordError
  }

  if (!values.confirmacion_password) {
    errors.confirmacion_password = 'Confirmá tu contraseña.'
  } else if (values.confirmacion_password !== values.password) {
    errors.confirmacion_password = 'La confirmación de contraseña no coincide.'
  }

  return errors
}

export function validateLoginForm(values: LoginValues): LoginFieldErrors {
  const errors: LoginFieldErrors = {}

  if (!values.email.trim()) {
    errors.email = 'El correo electrónico es obligatorio.'
  } else if (!emailPattern.test(values.email)) {
    errors.email = 'Ingresá un correo electrónico válido.'
  }

  if (!values.password) {
    errors.password = 'La contraseña es obligatoria.'
  }

  return errors
}

export function getRegisterBackendFieldError(
  detail: string,
): RegisterFieldErrors {
  const normalizedDetail = normalizeBackendDetail(detail)

  if (normalizedDetail.includes('correo electrónico')) {
    return { email: normalizedDetail }
  }

  if (normalizedDetail.includes('confirmación')) {
    return { confirmacion_password: normalizedDetail }
  }

  if (normalizedDetail.includes('contraseña')) {
    return { password: normalizedDetail }
  }

  return {}
}
