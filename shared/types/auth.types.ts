// shared/types/auth.types.ts
export interface RequestOtpPayload {
  phone: string
}

export interface VerifyOtpPayload {
  phone: string
  code: string
}

export interface VerifyOtpResponse {
  success: boolean
}

export interface BackendOtpVerifyResponse {
  token: string
}