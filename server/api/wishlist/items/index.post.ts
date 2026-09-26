export default defineEventHandler(async (event) => {
  requireWishlistSession(event)
  const body = await readWishlistItemPayload(event)
  await backendFetch('/wishlist/items', {
    method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'text/plain' },
    authorization: 'session', retry: 0,
  }, event)
  setResponseStatus(event, 201)
  return { success: true }
})
