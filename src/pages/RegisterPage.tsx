import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Alert, Button } from '@chakra-ui/react'
import {
  getRegisterBackendFieldError,
  initialRegisterValues,
  normalizeBackendDetail,
  registerProducer,
  validateRegisterForm,
  type RegisterFieldErrors,
  type RegisterValues,
} from '../features/auth'
import AuthTextField from '../features/auth/components/AuthTextField'
import { ApiError } from '../services/httpClient'

function RegisterPage() {
  const [values, setValues] = useState<RegisterValues>(initialRegisterValues)
  const [errors, setErrors] = useState<RegisterFieldErrors>({})
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField =
    (field: keyof RegisterValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }))
      setErrors((current) => ({ ...current, [field]: undefined }))
      setFormError('')
    }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    const nextErrors = validateRegisterForm(values)
    setErrors(nextErrors)
    setFormError('')

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      await registerProducer({
        nombre: values.nombre.trim(),
        apellido: values.apellido.trim(),
        email: values.email.trim(),
        password: values.password,
        confirmacion_password: values.confirmacion_password,
      })

      const message = 'Cuenta creada correctamente. Ya podés iniciar sesión.'
      setSuccessMessage(message)
      sessionStorage.setItem('register-success-message', message)

      window.setTimeout(() => {
        window.location.assign('/login')
      }, 1200)
    } catch (error) {
      if (error instanceof ApiError) {
        const backendErrors = getRegisterBackendFieldError(error.detail)
        if (Object.keys(backendErrors).length > 0) {
          setErrors((current) => ({ ...current, ...backendErrors }))
        } else {
          setFormError(normalizeBackendDetail(error.detail))
        }
      } else {
        setFormError('No se pudo crear la cuenta. Probá nuevamente.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="register-title">
        <div className="panel-heading">
          <p className="eyebrow">Registro de productores</p>
          <h1 id="register-title">Crear cuenta</h1>
          <p className="muted">
            Completá tus datos para registrar tu cuenta de productor.
          </p>
        </div>

        {formError ? (
          <Alert.Root
            status="error"
            colorPalette="danger"
            className="auth-alert">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{formError}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        ) : null}

        {successMessage ? (
          <Alert.Root
            status="success"
            colorPalette="success"
            className="auth-alert">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{successMessage}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        ) : null}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field-row">
            <AuthTextField
              id="nombre"
              label="Nombre"
              name="nombre"
              autoComplete="given-name"
              value={values.nombre}
              onChange={updateField('nombre')}
              error={errors.nombre}
            />

            <AuthTextField
              id="apellido"
              label="Apellido"
              name="apellido"
              autoComplete="family-name"
              value={values.apellido}
              onChange={updateField('apellido')}
              error={errors.apellido}
            />
          </div>

          <AuthTextField
            id="email"
            label="Correo electrónico"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={updateField('email')}
            error={errors.email}
          />

          <AuthTextField
            id="password"
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={updateField('password')}
            error={errors.password}
          />

          <AuthTextField
            id="confirmacion-password"
            label="Confirmación de contraseña"
            name="confirmacion_password"
            type="password"
            autoComplete="new-password"
            value={values.confirmacion_password}
            onChange={updateField('confirmacion_password')}
            error={errors.confirmacion_password}
          />

          <Button
            type="submit"
            colorPalette="brand"
            size="lg"
            loading={isSubmitting}
            loadingText="Creando cuenta...">
            Crear cuenta
          </Button>
        </form>

        <p className="auth-footer">
          ¿Ya tenés cuenta? <a href="/login">Iniciá sesión</a>
        </p>
      </section>
    </main>
  )
}

export default RegisterPage
