export default defineEventHandler(async (event) => {
  const body = await readBody<VerifyOtpPayload>(event)


  const res = await backendFetch<BackendOtpVerifyResponse>('api/auth/otp/verify', {
    method: 'POST',
    body:{ phone: body.phone,
           code: body.code },
  })

  setCookie(event, 'auth_token', res.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })

    return { success: true } satisfies VerifyOtpResponse

})