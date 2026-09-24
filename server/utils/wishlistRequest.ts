import type { H3Event } from 'h3'

export function requireWishlistSession(event: H3Event) {
  setHeader(event, 'Cache-Control', 'no-store')
  if (!resolveCredential(event)) throw createError({ statusCode: 401, message: 'Shopping session required' })
}

export async function readWishlistItemPayload(event: H3Event): Promise<WishlistItemPayload> {
  const raw = await readRawBody(event)
  let body: unknown
  try { body = JSON.parse(raw ?? '') }
  catch { throw createError({ statusCode: 400, message: 'شناسه محصول معتبر نیست.' }) }
  if (!body || typeof body !== 'object') throw createError({ statusCode: 400, message: 'شناسه محصول معتبر نیست.' })
  const value = body as Record<string, unknown>
  if (typeof value.product_id !== 'string' || !value.product_id.trim()
    || (value.variant_id !== undefined && (typeof value.variant_id !== 'string' || !value.variant_id.trim()))) {
    throw createError({ statusCode: 400, message: 'شناسه محصول یا گزینه معتبر نیست.' })
  }
  return {
    product_id: value.product_id.trim(),
    ...(typeof value.variant_id === 'string' ? { variant_id: value.variant_id.trim() } : {}),
  }
}

export function wishlistItemPath(event: H3Event) {
  const id = getRouterParam(event, 'itemId')
  if (!id) throw createError({ statusCode: 400, message: 'Wishlist item ID required' })
  return `/api/wishlist/items/${encodeURIComponent(id)}`
}
