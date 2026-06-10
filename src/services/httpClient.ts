const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api'

type ApiErrorBody = {
  detail?: string
}

export class ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

export async function postJson<TResponse, TPayload>(
  path: string,
  payload?: TPayload,
  accessToken?: string | null,
): Promise<TResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: payload === undefined ? undefined : JSON.stringify(payload),
  })

  const body = (await response.json().catch(() => ({}))) as ApiErrorBody

  if (!response.ok) {
    throw new ApiError(
      response.status,
      body.detail ?? 'No se pudo completar la operación. Probá nuevamente.',
    )
  }

  return body as TResponse
}
