export default defineEventHandler(async (event) => {
  const body = await readBody<VerifyOtpPayload>(event)


  const res = await backendFetch<BackendOtpVerifyResponse>('api/auth/otp/verify', {
    method: 'POST',
    authorization: 'none',
    // The backend expects JSON encoded as text/plain for this endpoint.
    body: JSON.stringify({ phone: body.phone, code: body.code }),
    headers: { 'Content-Type': 'text/plain' },
  })

  if (!res.token?.trim()) throw createError({ statusCode: 502, message: 'Invalid authentication response' })
  setCookie(event, 'auth_token', res.token, sessionCookieOptions)
  clearCredential(event, 'guest')
  return { success: true } satisfies VerifyOtpResponse
})
