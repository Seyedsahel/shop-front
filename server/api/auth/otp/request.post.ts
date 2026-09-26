export default defineEventHandler(async (event) => {
  const body = await readBody<RequestOtpPayload>(event)

  const response = await backendFetch<RequestOtpResponse>('/auth/otp/request', {
    method: 'POST',
    authorization: 'none',
    // The backend expects JSON encoded as text/plain for this endpoint.
    body: JSON.stringify({ phone: body.phone }),
    headers: { 'Content-Type': 'text/plain' },
  })
  
  return response
})
