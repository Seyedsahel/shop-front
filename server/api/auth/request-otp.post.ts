export default defineEventHandler(async (event) => {
  const body = await readBody<RequestOtpPayload>(event)
  const config = useRuntimeConfig()

  // return await backendFetch('/auth/request-otp', { method: 'POST', body })
  console.log('Request OTP for phone:', body.phone)
  return { success: true }
})