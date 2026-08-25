export default defineEventHandler(async (event): Promise<FiltersResponse> => {
  const config = useRuntimeConfig()
  return config.useMockData ? mockFiltersResponse : await backendFetch<FiltersResponse>('/catalog/filters')
})