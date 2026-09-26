export default defineEventHandler(async (event): Promise<ProductDetail> => {
  const slug = getRouterParam(event, 'slug')
  const raw = await backendFetch(`/api/products/${encodeURIComponent(slug ?? '')}/detail`, {}, event)
  return mapProductDetail(raw)
})
