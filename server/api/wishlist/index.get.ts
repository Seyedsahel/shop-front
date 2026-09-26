export default defineEventHandler(async (event): Promise<WishlistResponse> => {
  requireWishlistSession(event)
  const wishlist = await backendFetch<unknown>('/wishlist', { authorization: 'session' }, event)
  if (!wishlist || typeof wishlist !== 'object') throw createError({ statusCode: 502, message: 'Invalid wishlist response from backend' })
  const value = wishlist as Record<string, unknown>
  if (!value.products || typeof value.products !== 'object' || Array.isArray(value.products)) {
    throw createError({ statusCode: 502, message: 'Invalid wishlist response from backend' })
  }
  const normalized = value as unknown as WishlistResponse
  for (const item of Object.values(normalized.products)) {
    item.image_url = item.image_url ? toBackendImageUrl(item.image_url) || null : null
  }
  return normalized
})
