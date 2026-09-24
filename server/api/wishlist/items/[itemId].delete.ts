export default defineEventHandler(async (event) => {
  requireWishlistSession(event)
  await backendFetch(wishlistItemPath(event), { method: 'DELETE', authorization: 'session', retry: 0 }, event)
  return { success: true }
})
