export default defineEventHandler(async (event): Promise<ConsultationNoticeResponse> => {
  const config = useRuntimeConfig()
  if (config.useMockData) return mockConsultationNotice
  const response = await backendFetch<unknown>('/booking/consultation-notice')
  if (!response || typeof response !== 'object' || !Array.isArray((response as Record<string, unknown>).items)) {
    throw createError({ statusCode: 502, message: 'Invalid consultation notice response from backend' })
  }
  return response as ConsultationNoticeResponse
})
