export default defineEventHandler(async (event): Promise<ConsultationNoticeResponse> => {
  const response = await backendFetch<unknown>('/booking/consultation-notice', { authorization: 'none' }, event)
  if (Array.isArray(response) && response.length === 0) return { items: [] }
  if (!response || typeof response !== 'object' || !Array.isArray((response as Record<string, unknown>).items)) {
    throw createError({ statusCode: 502, message: 'Invalid consultation notice response from backend' })
  }
  return response as ConsultationNoticeResponse
})
