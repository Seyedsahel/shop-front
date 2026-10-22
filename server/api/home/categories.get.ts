export default defineEventHandler(async (event): Promise<CategoriesResponse> => {
  const raw = await backendFetch<unknown>('/home/categories', { authorization: 'none' }, event)
  return mapCategoriesResponse(raw)
})
