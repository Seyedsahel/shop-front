import type { H3Event } from 'h3'

export function requireCheckoutUser(event: H3Event) {
  setHeader(event, 'Cache-Control', 'no-store')
  if (!resolveCredential(event, 'user')) {
    throw createError({ statusCode: 401, message: 'ورود به حساب کاربری لازم است.' })
  }
}

export async function readCheckoutInput(event: H3Event): Promise<CheckoutInput> {
  const body = await readBody<Partial<CheckoutInput>>(event)
  if (!body || typeof body.cart_id !== 'string' || !body.cart_id.trim()
    || typeof body.shipping_method_id !== 'string' || !body.shipping_method_id.trim()
    || (body.coupon_code !== undefined && typeof body.coupon_code !== 'string')
    || (body.torob_clid !== undefined && typeof body.torob_clid !== 'string')) {
    throw createError({ statusCode: 400, message: 'اطلاعات سفارش کامل نیست.' })
  }
  if ((body.address_id !== undefined) === (body.address !== undefined)
    || (body.address_id !== undefined && (typeof body.address_id !== 'string' || !body.address_id.trim()))) {
    throw createError({ statusCode: 400, message: 'نشانی یا اطلاعات تحویل را وارد کنید.' })
  }
  let source: { address_id: string; address?: never } | { address: CheckoutInlineAddress; address_id?: never }
  if (body.address_id !== undefined) source = { address_id: body.address_id.trim() }
  else {
    const raw = body.address
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw createError({ statusCode: 400, message: 'اطلاعات تحویل معتبر نیست.' })
    }
    const address: CheckoutInlineAddress = {}
    for (const field of ['address', 'first_name', 'last_name', 'phone', 'postal_code'] as const) {
      const value = raw[field]
      if (value === undefined) continue
      if (typeof value !== 'string') throw createError({ statusCode: 400, message: 'اطلاعات تحویل معتبر نیست.' })
      address[field] = value.trim()
    }
    for (const field of ['city_code', 'province_code'] as const) {
      const value = raw[field]
      if (value === undefined) continue
      if (!Number.isSafeInteger(value) || value < 0) throw createError({ statusCode: 400, message: 'اطلاعات تحویل معتبر نیست.' })
      address[field] = value
    }
    if (!Object.values(address).some(value => !!value)) throw createError({ statusCode: 400, message: 'اطلاعات تحویل کامل نیست.' })
    source = { address }
  }
  const coupon = body.coupon_code?.trim()
  return {
    ...source,
    cart_id: body.cart_id.trim(), shipping_method_id: body.shipping_method_id.trim(),
    ...(coupon ? { coupon_code: coupon } : {}),
    ...(body.torob_clid !== undefined ? { torob_clid: body.torob_clid } : {}),
  }
}
