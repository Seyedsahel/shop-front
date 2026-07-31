export default defineEventHandler(async (event): Promise<SubmitConsultationResponse> => {
  const body = await readBody<SubmitConsultationPayload>(event)
  const config = useRuntimeConfig()

  if (config.useMockData) return { success: true }

  return await backendFetch<SubmitConsultationResponse>('/booking/consultation-request', {
    method: 'POST',
    body,
  })
})