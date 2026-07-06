import { useState } from 'react'
import {
  clearSession,
  getAccessToken,
  getStoredUser,
  logoutProducer,
  normalizeBackendDetail,
} from '../features/auth'
import { ApiError } from '../services/httpClient'

function HomePage() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const user = getStoredUser()
  const accessToken = getAccessToken()

  const handleLogout = async () => {
    if (isLoggingOut) {
      return
    }

    setIsLoggingOut(true)
    setLogoutError('')

    try {
      await logoutProducer(accessToken)
    } catch (error) {
      if (error instanceof ApiError) {
        setLogoutError(normalizeBackendDetail(error.detail))
      } else {
        setLogoutError('No pudimos confirmar el cierre en el servidor.')
      }
    } finally {
      clearSession()
      window.location.assign('/login')
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel login-panel" aria-labelledby="home-title">
        <p className="eyebrow">Sesión activa</p>
        <h1 id="home-title">
          {user ? `Hola, ${user.nombre}` : 'Bienvenido'}
        </h1>
        {accessToken ? (
          <p className="status-message success" role="status">
            Iniciaste sesión correctamente. El token JWT quedó guardado para las
            próximas llamadas autenticadas.
          </p>
        ) : (
          <p className="muted">
            Todavía no hay una sesión activa. Iniciá sesión para entrar.
          </p>
        )}
        {logoutError ? (
          <p className="status-message error" role="alert">
            {logoutError}
          </p>
        ) : null}
        <div className="auth-actions">
          {accessToken ? (
            <button
              className="secondary-action"
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
            </button>
          ) : (
            <>
              <a className="text-link" href="/login">
                Iniciar sesión
              </a>
              <a className="text-link" href="/register">
                Crear cuenta
              </a>
            </>
          )}
        </div>
      </section>
    </main>
  )
}

export default HomePage
