export default defineEventHandler(async (event): Promise<ConsultationQuestionsResponse> => {
  const config = useRuntimeConfig()
  return config.useMockData ? mockConsultationQuestions : await backendFetch<ConsultationQuestionsResponse>('/booking/consultation-questions')
})