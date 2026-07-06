import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth";
import {
  initialLoginValues,
  loginProducer,
  normalizeBackendDetail,
  saveSession,
  validateLoginForm,
  type LoginFieldErrors,
  type LoginValues,
} from "../features/auth";
import AuthTextField from "../features/auth/components/AuthTextField";
import { ApiError } from "../services/httpClient";

function LoginPage() {
  const { refreshSession } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState<LoginValues>(initialLoginValues);
  const [errors, setErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const successMessage = useMemo(() => {
    const message = sessionStorage.getItem("register-success-message");
    sessionStorage.removeItem("register-success-message");
    return message;
  }, []);

  const updateField =
    (field: keyof LoginValues) => (event: ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
      setFormError("");
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextErrors = validateLoginForm(values);
    setErrors(nextErrors);
    setFormError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await loginProducer({
        email: values.email.trim(),
        password: values.password,
      });

      saveSession(response.access_token, response.token_type, response.user);
      refreshSession();
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(normalizeBackendDetail(error.detail));
      } else {
        setFormError("No se pudo iniciar sesión. Probá nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="login-title">
        <div className="panel-heading">
          <p className="eyebrow">Acceso de productores</p>
          <h1 id="login-title">Iniciar sesión</h1>
          <p className="muted">
            Entrá con el correo electrónico y la contraseña de tu cuenta.
          </p>
        </div>

        {successMessage ? (
          <p className="status-message success" role="status">
            {successMessage}
          </p>
        ) : null}

        {formError ? (
          <p className="status-message error" role="alert">
            {formError}
          </p>
        ) : null}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <AuthTextField
            id="login-email"
            label="Correo electrónico"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={updateField("email")}
            error={errors.email}
          />

          <AuthTextField
            id="login-password"
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={updateField("password")}
            error={errors.password}
          />

          <button
            className="primary-action"
            type="submit"
            disabled={isSubmitting}>
            {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        {/* <p className="auth-footer">
          ¿Todavía no tenés cuenta? <a href="/register">Creá una acá</a>
        </p> */}
      </section>
    </main>
  );
}

export default LoginPage;
