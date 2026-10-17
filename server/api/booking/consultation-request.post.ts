export default defineEventHandler(async (event): Promise<SubmitConsultationResponse> => {
  const body = await readBody<SubmitConsultationPayload>(event)
  return await backendFetch<SubmitConsultationResponse>('/booking/consultation-request', {
    method: 'POST', authorization: 'user',
    body,
  }, event)
})