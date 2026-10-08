export default defineEventHandler(async (event) => {
  const body = parseOtpRequestInput(await readBody<unknown>(event))
  if (!body) {
    const message = 'شماره موبایل معتبر وارد کنید.'
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message, data: { validationMessage: message } })
  }

  const response = await backendFetch<RequestOtpResponse>('/auth/otp/request', {
    method: 'POST',
    authorization: 'none',
    // The backend expects JSON encoded as text/plain for this endpoint.
    body: JSON.stringify({ phone: body.phone }),
    headers: { 'Content-Type': 'text/plain' },
  }, event)
  
  return response
})
