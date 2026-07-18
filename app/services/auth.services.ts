export const authService = {
  requestOtp: (payload: RequestOtpPayload) =>
    apiFetch<VerifyOtpResponse>('/auth/request-otp', {
      method: 'POST',
      body: payload,
    }),

  verifyOtp: (payload: VerifyOtpPayload) =>
    apiFetch<VerifyOtpResponse>('/auth/verify-otp', {
      method: 'POST',
      body: payload,
    }),

  getSession: () =>
    apiFetch<SessionResponse>('/auth/me'),

  logout: () =>
    apiFetch<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    }),
}