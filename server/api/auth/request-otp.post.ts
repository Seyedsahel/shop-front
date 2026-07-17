// server/api/auth/request-otp.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  // return await $fetch(`${config.backendUrl}/auth/request-otp`, {
  //   method: 'POST',
  //   body: { phone: body.phone },
  //   headers: { 'x-api-key': config.backendApiKey } // server-only secret
  // })
  console.log('Request OTP for phone:', body.phone)
  return { success: true }
})