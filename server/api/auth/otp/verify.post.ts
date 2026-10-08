export default defineEventHandler(async (event) => {
  const body = parseOtpVerifyInput(await readBody<unknown>(event))
  if (!body) {
    const message = 'شماره موبایل و کد تایید ۴ رقمی معتبر وارد کنید.'
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message, data: { validationMessage: message } })
  }

  const res = await backendFetch<BackendOtpVerifyResponse>('/auth/otp/verify', {
    method: 'POST',
    // Preserve the guest bearer credential so the backend can merge its cart
    // into the authenticated account before this proxy replaces the cookie.
    authorization: 'session',
    // The backend expects JSON encoded as text/plain for this endpoint.
    body: JSON.stringify({ phone: body.phone, code: body.code }),
    headers: { 'Content-Type': 'text/plain' },
  }, event)

  if (!res.token?.trim()) throw createError({ statusCode: 502, message: 'Invalid authentication response' })
  setCookie(event, 'auth_token', res.token, sessionCookieOptions)
  clearCredential(event, 'guest')
  return { success: true } satisfies VerifyOtpResponse
})
