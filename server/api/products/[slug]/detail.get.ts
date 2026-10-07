export default defineEventHandler(async (event): Promise<ProductDetail> => {
  const slug = getRouterParam(event, 'slug')
  const raw = await backendFetch(`/products/${encodeURIComponent(slug ?? '')}/detail`, { authorization: 'none' }, event)
  return mapProductDetail(raw)
})
