export default defineEventHandler(async (event): Promise<BrandsResponse> => {
  const config = useRuntimeConfig()
  return config.useMockData ? mockBrandsResponse : await backendFetch<BrandsResponse>('/catalog/brands')
})