// server/api/auth/verify-otp.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody<VerifyOtpPayload>(event)
  const config = useRuntimeConfig()

//   const res = await $fetch<BackendOtpVerifyResponse>(`${config.backendUrl}/auth/verify-otp`, {
//     method: 'POST',
//     body: { phone: body.phone, code: body.code },
//     headers: { 'x-api-key': config.backendApiKey }
//   })

//   setCookie(event, 'auth_token', res.token, {
//     httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30
//   })
console.log('Verify OTP for phone:', body.phone, 'with code:', body.code)

  return { success: true } satisfies VerifyOtpResponse
})