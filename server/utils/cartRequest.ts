import type { H3Event } from 'h3'

export function requireCartSession(event: H3Event) {
  setHeader(event, 'Cache-Control', 'no-store')
  if (!resolveCredential(event)) throw createError({ statusCode: 401, message: 'Shopping session required' })
}
export async function readCartItemPayload(event: H3Event): Promise<CartItemPayload> {
  const body = await readBody<CartItemPayload>(event)
  const variantId = body?.variant_id == null || body.variant_id === '' ? null : body.variant_id
  if (!body || typeof body.product_id !== 'string' || !body.product_id.trim()
    || !Number.isSafeInteger(body.quantity) || body.quantity < 1
    || !(variantId === null || typeof variantId === 'string')) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'شناسه محصول یا تعداد کالا معتبر نیست.' })
  }
  return { product_id: body.product_id, quantity: body.quantity, variant_id: typeof variantId === 'string' ? variantId.trim() || null : null }
}
export function cartItemPath(event: H3Event) {
  const id = getRouterParam(event, 'itemId')
  if (!id) throw createError({ statusCode: 400, message: 'Cart item ID required' })
  return `/api/cart/items/${encodeURIComponent(id)}`
}
