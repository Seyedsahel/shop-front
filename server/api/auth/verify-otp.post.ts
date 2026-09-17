export default defineEventHandler(async (event) => {
  const body = await readBody<VerifyOtpPayload>(event)


  const res = await backendFetch<BackendOtpVerifyResponse>('api/auth/otp/verify', {
    method: 'POST',
    // The backend expects JSON encoded as text/plain for this endpoint.
    body: JSON.stringify({ phone: body.phone, code: body.code }),
    headers: { 'Content-Type': 'text/plain' },
  })

  setCookie(event, 'auth_token', res.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })

    return { success: true } satisfies VerifyOtpResponse

})
