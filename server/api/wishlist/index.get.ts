export default defineEventHandler(async (event): Promise<WishlistResponse> => {
  requireWishlistSession(event)
  const wishlist = await backendFetch<WishlistResponse>('/wishlist', { authorization: 'session' }, event)
  for (const item of Object.values(wishlist.products ?? {})) {
    item.image_url = item.image_url ? toBackendImageUrl(item.image_url) || null : null
  }
  return wishlist
})
