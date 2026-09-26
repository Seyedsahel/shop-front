export default defineEventHandler(async (event): Promise<CartResponse> => {
  requireCartSession(event)
  const cart = await backendFetch<unknown>('/cart', { authorization: 'session' }, event)
  if (!cart || typeof cart !== 'object') throw createError({ statusCode: 502, message: 'Invalid cart response from backend' })
  const value = cart as Record<string, unknown>
  if (!value.products || typeof value.products !== 'object' || Array.isArray(value.products)
    || !value.pricing || typeof value.pricing !== 'object' || Array.isArray(value.pricing)) {
    throw createError({ statusCode: 502, message: 'Invalid cart response from backend' })
  }
  const normalized = value as unknown as CartResponse
  for (const item of Object.values(normalized.products)) {
    item.image_url = item.image_url ? toBackendImageUrl(item.image_url) || null : null
  }
  return normalized
})
