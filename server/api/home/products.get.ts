export default defineEventHandler(async (event): Promise<ProductListResponse> => {
  const raw = await backendFetch<unknown>('/home/products', { authorization: 'none' }, event)
  return mapProductListResponse(raw)
})
