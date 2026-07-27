export default defineEventHandler(async (event): Promise<BannersResponse> => {
  const config = useRuntimeConfig()
  return config.useMockData
    ? mockBannersResponse
    : await backendFetch<BannersResponse>('/engagement/banners')
})