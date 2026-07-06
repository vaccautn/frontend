import { postJson } from "../../../services/httpClient";
import type {
  LoginPayload,
  LoginResponse,
  LogoutResponse,
  RegisterProducerPayload,
  RegisterProducerResponse,
} from "../types/authTypes";

export function registerProducer(
  payload: RegisterProducerPayload,
): Promise<RegisterProducerResponse> {
  return postJson<RegisterProducerResponse, RegisterProducerPayload>(
    "/auth/register",
    payload,
  );
}

export function loginProducer(payload: LoginPayload): Promise<LoginResponse> {
  return postJson<LoginResponse, LoginPayload>("/auth/login", payload);
}

export function logoutProducer(token?: string | null): Promise<LogoutResponse> {
  return postJson<LogoutResponse, undefined>("/auth/logout", undefined, token);
}
