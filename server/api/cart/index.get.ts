export default defineEventHandler(async (event): Promise<CartResponse> => {
  requireCartSession(event)
  const cart = await backendFetch<CartResponse>('/cart', { authorization: 'session' }, event)
  for (const item of Object.values(cart.products)) {
    item.image_url = item.image_url ? toBackendImageUrl(item.image_url) || null : null
  }
  return cart
})
