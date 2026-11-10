export {
  loginProducer,
  logoutProducer,
  registerProducer,
} from "./services/authService";

export {
  clearSession,
  consumirAvisoSesionVencida,
  getAccessToken,
  getStoredUser,
  saveSession,
} from "./store/authSession";

export { AuthProvider } from "./store/AuthContext";
export { useAuth } from "./store/useAuth";

export type { AuthUser } from "./types/authTypes";

export { normalizeBackendDetail } from "./utils/authMessages";

export {
  getRegisterBackendFieldError,
  initialLoginValues,
  initialRegisterValues,
  validateLoginForm,
  validateRegisterForm,
} from "./utils/authValidation";

export type {
  LoginFieldErrors,
  LoginValues,
  RegisterFieldErrors,
  RegisterValues,
} from "./utils/authValidation";
