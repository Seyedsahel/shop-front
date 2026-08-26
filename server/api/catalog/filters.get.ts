
// const sleep = (ms: number): Promise<void> => {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// };

export default defineEventHandler(async (event): Promise<FiltersResponse> => {
  const config = useRuntimeConfig()
  return config.useMockData ? mockFiltersResponse : await backendFetch<FiltersResponse>('/catalog/filters')
})

