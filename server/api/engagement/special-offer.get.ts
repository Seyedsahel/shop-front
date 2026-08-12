export default defineEventHandler(async (event): Promise<SpecialOfferResponse> => {
  const config = useRuntimeConfig()
  return config.useMockData ? mockSpecialOfferResponse : await backendFetch<SpecialOfferResponse>('/engagement/special-offer')
})