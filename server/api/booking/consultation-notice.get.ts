export default defineEventHandler(async (event): Promise<ConsultationNoticeResponse> => {
  const config = useRuntimeConfig()
  return config.useMockData ? mockConsultationNotice : await backendFetch<ConsultationNoticeResponse>('/booking/consultation-notice')
})