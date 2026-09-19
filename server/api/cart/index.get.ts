export default defineEventHandler(async (event): Promise<CartViewResponse> => {
  requireCartSession(event)
  const cart = await backendFetch<CartResponse>('/api/cart', { authorization: 'session' }, event)
  for (const item of Object.values(cart.products)) item.variant_id = item.variant_id?.trim() || null
  const ids = [...new Set(Object.values(cart.products).map(item => item.product_id))]
  const presentation: CartViewResponse['presentation'] = {}
  // Bound enrichment concurrency and fetch each product only once per cart response.
  for (let offset = 0; offset < ids.length; offset += 6) {
    await Promise.all(ids.slice(offset, offset + 6).map(async id => {
      try {
        const product = await backendFetch<BackendProductLookupResponse>(`/api/products/${encodeURIComponent(id)}`, {}, event)
        const detail = await backendFetch(`/api/products/${encodeURIComponent(product.slug)}/detail`, {}, event)
        const mapped = mapProductDetail(detail)
        if (!mapped.images.length && product.thumbnail_url) {
          mapped.images.push({ imageUrl: toBackendImageUrl(product.thumbnail_url), sortOrder: 0, isThumbnail: true })
        }
        presentation[id] = mapped
      } catch (error: any) {
        if ((error.statusCode ?? error.response?.status) === 401) throw error
        // Missing/deleted products must not prevent removing an existing cart item.
        presentation[id] = null
      }
    }))
  }
  return { ...cart, presentation }
})
