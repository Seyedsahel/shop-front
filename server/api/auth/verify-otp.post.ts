// server/api/auth/verify-otp.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody<VerifyOtpPayload>(event)


  // const res = await backendFetch<BackendOtpVerifyResponse>('/auth/verify-otp', {
  //   method: 'POST',
  //   body,
  // })

  // setCookie(event, 'auth_token', res.token, {
  //     httpOnly: true,
  //     secure: true,
  //     sameSite: 'lax',
  //     path: '/',
  //     maxAge: 60 * 60 * 24 * 30,
  //   })
console.log('Verify OTP for phone:', body.phone, 'with code:', body.code)

  return { success: true } satisfies VerifyOtpResponse
})