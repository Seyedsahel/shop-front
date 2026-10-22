export default defineEventHandler(async (event): Promise<CategoriesResponse> => {
  const raw = await backendFetch<unknown>('/categories', { authorization: 'none' }, event)
  return mapCategoriesResponse(raw)
})
