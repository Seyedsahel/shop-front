export default defineEventHandler(async (event): Promise<ConsultationQuestionsResponse> => {
  const response = await backendFetch<unknown>('/booking/consultation-questions', { authorization: 'none' }, event)
  if (Array.isArray(response) && response.length === 0) return { items: [] }
  if (!response || typeof response !== 'object' || !Array.isArray((response as Record<string, unknown>).items)) {
    throw createError({ statusCode: 502, message: 'Invalid consultation questions response from backend' })
  }
  return response as ConsultationQuestionsResponse
})
