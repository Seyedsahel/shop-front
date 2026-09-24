import type { H3Event } from 'h3'

export function requireCheckoutUser(event: H3Event) {
  setHeader(event, 'Cache-Control', 'no-store')
  if (!resolveCredential(event, 'user')) {
    throw createError({ statusCode: 401, message: 'ورود به حساب کاربری لازم است.' })
  }
}

export async function readCheckoutInput(event: H3Event): Promise<CheckoutInput> {
  const body = await readBody<Partial<CheckoutInput>>(event)
  if (!body || typeof body.address_id !== 'string' || !body.address_id.trim()
    || typeof body.cart_id !== 'string' || !body.cart_id.trim()
    || typeof body.shipping_method_id !== 'string' || !body.shipping_method_id.trim()
    || (body.coupon_code !== undefined && typeof body.coupon_code !== 'string')) {
    throw createError({ statusCode: 400, message: 'اطلاعات سفارش کامل نیست.' })
  }
  const coupon = body.coupon_code?.trim()
  return {
    address_id: body.address_id.trim(),
    cart_id: body.cart_id.trim(), shipping_method_id: body.shipping_method_id.trim(),
    ...(coupon ? { coupon_code: coupon } : {}),
  }
}
