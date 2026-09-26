export default defineEventHandler(async (event): Promise<ConsultationQuestionsResponse> => {
  const config = useRuntimeConfig()
  if (config.useMockData) return mockConsultationQuestions
  const response = await backendFetch<unknown>('/booking/consultation-questions')
  if (!response || typeof response !== 'object' || !Array.isArray((response as Record<string, unknown>).items)) {
    throw createError({ statusCode: 502, message: 'Invalid consultation questions response from backend' })
  }
  return response as ConsultationQuestionsResponse
})
