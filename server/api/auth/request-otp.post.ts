export default defineEventHandler(async (event) => {
  const body = await readBody<RequestOtpPayload>(event)

  await backendFetch('api/auth/otp/request', { 
    method: 'POST',
    body: { phone: body.phone },
   })
  
  return { success: true } satisfies VerifyOtpResponse
})