// shared/types/auth.types.ts
export interface RequestOtpPayload {
  phone: string
}

export interface VerifyOtpPayload {
  phone: string
  code: string
}

export interface RequestOtpResponse {
  message: string
}

export interface VerifyOtpResponse {
  success: boolean
}

export interface BackendOtpVerifyResponse {
  token: string
}

export interface BackendLogoutPayload {
  refresh_token: string
}

export interface BackendLogoutResponse {
  status: string
}

export interface User {
  id: string
  name?: string
  phone: string
}

export interface SessionResponse {
  isAuthenticated: boolean
  user?: User
}
