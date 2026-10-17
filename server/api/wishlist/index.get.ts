export default defineEventHandler(async (event): Promise<WishlistResponse> => {
  requireWishlistSession(event)
  const wishlist = await backendFetch<unknown>('/wishlist', { authorization: 'session' }, event)
  if (Array.isArray(wishlist) && wishlist.length === 0) return { id: '', guest_id: '', user_id: '', products: {} }
  if (!wishlist || typeof wishlist !== 'object') throw createError({ statusCode: 502, message: 'Invalid wishlist response from backend' })
  const value = wishlist as Record<string, unknown>
  if (Array.isArray(value.products) && value.products.length === 0) value.products = {}
  if (!value.products || typeof value.products !== 'object' || Array.isArray(value.products)) {
    throw createError({ statusCode: 502, message: 'Invalid wishlist response from backend' })
  }
  const normalized = value as unknown as WishlistResponse
  for (const item of Object.values(normalized.products)) {
    item.image_url = item.image_url ? toBackendImageUrl(item.image_url) || null : null
  }
  return normalized
})
