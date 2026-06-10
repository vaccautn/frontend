export type RegisterProducerPayload = {
  nombre: string
  apellido: string
  email: string
  password: string
  confirmacion_password: string
}

export type AuthUser = {
  id: number
  nombre: string
  apellido: string
  email: string
  rol: string
}

export type RegisterProducerResponse = {
  message: string
  user: AuthUser
}

export type LoginPayload = {
  email: string
  password: string
}

export type LoginResponse = {
  message: string
  access_token: string
  token_type: 'Bearer'
  user: AuthUser
}

export type LogoutResponse = {
  message: string
}
