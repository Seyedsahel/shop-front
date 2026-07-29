export default defineEventHandler(async (event): Promise<CategoriesResponse> => {
  const config = useRuntimeConfig()
  return config.useMockData ? mockCategoriesResponse : await backendFetch<CategoriesResponse>('/catalog/categories')
})