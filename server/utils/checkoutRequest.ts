import type { H3Event } from 'h3'

export function requireCheckoutUser(event: H3Event) {
  setHeader(event, 'Cache-Control', 'no-store')
  if (!resolveCredential(event, 'user')) {
    throw createError({ statusCode: 401, message: 'ورود به حساب کاربری لازم است.' })
  }
}

export async function readCheckoutInput(event: H3Event): Promise<CheckoutInput> {
  const body = await readBody<Partial<CheckoutInput>>(event)
  if (!body || (body.address_id !== undefined && (typeof body.address_id !== 'string' || !body.address_id.trim()))
    || typeof body.cart_id !== 'string' || !body.cart_id.trim()
    || typeof body.shipping_method_id !== 'string' || !body.shipping_method_id.trim()
    || (body.coupon_code !== undefined && typeof body.coupon_code !== 'string')
    || (body.recipient_name !== undefined && typeof body.recipient_name !== 'string')
    || (body.phone !== undefined && typeof body.phone !== 'string')
    || (body.address !== undefined && typeof body.address !== 'string')
    || (body.postal_code !== undefined && typeof body.postal_code !== 'string')
    || (body.province_code !== undefined && (!Number.isSafeInteger(body.province_code) || body.province_code <= 0))
    || (body.city_code !== undefined && (!Number.isSafeInteger(body.city_code) || body.city_code <= 0))) {
    throw createError({ statusCode: 400, message: 'اطلاعات سفارش کامل نیست.' })
  }
  const coupon = body.coupon_code?.trim()
  return {
    ...(body.address_id ? { address_id: body.address_id.trim() } : {}),
    cart_id: body.cart_id.trim(), shipping_method_id: body.shipping_method_id.trim(),
    ...(coupon ? { coupon_code: coupon } : {}),
    ...(body.recipient_name ? { recipient_name: body.recipient_name.trim() } : {}),
    ...(body.phone ? { phone: body.phone.trim() } : {}),
    ...(body.province_code ? { province_code: body.province_code } : {}),
    ...(body.city_code ? { city_code: body.city_code } : {}),
    ...(body.address ? { address: body.address.trim() } : {}),
    ...(body.postal_code ? { postal_code: body.postal_code.trim() } : {}),
  }
}
