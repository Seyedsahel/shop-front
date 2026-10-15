export default defineEventHandler(async (event): Promise<OrderDetail> => {
  requireOrderUser(event)
  const order = await backendFetch<unknown>(orderPath(event), { authorization: 'user' }, event)
  if (!order || typeof order !== 'object' || !Array.isArray((order as Record<string, unknown>).items)) {
    throw createError({ statusCode: 502, message: 'Invalid order response from backend' })
  }
  const detail = order as OrderDetail
  const thumbnails = new Map<string, Promise<string>>()
  const items = await Promise.all(detail.items.map(async (item) => {
    if (item.image_url) return { ...item, image_url: toBackendImageUrl(item.image_url) }
    if (!item.product_id) return { ...item, image_url: '' }

    let thumbnail = thumbnails.get(item.product_id)
    if (!thumbnail) {
      // Images are optional: deleted products and catalog outages must not hide an order.
      thumbnail = backendFetch<BackendProductLookupResponse>(`/products/${encodeURIComponent(item.product_id)}`, {
        authorization: 'none', timeout: 2500,
      }, event).then(product => toBackendImageUrl(product.thumbnail_url)).catch(() => '')
      thumbnails.set(item.product_id, thumbnail)
    }
    return { ...item, image_url: await thumbnail }
  }))
  return { ...detail, items }
})
