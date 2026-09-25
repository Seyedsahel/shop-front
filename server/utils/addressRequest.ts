import type { H3Event } from 'h3'

export function requireAddressUser(event: H3Event) {
  setHeader(event, 'Cache-Control', 'no-store')
  if (!resolveCredential(event, 'user')) {
    throw createError({ statusCode: 401, message: 'ورود به حساب کاربری لازم است.' })
  }
}

export function addressPath(event: H3Event) {
  const id = getRouterParam(event, 'addressId')
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw createError({ statusCode: 400, message: 'شناسه نشانی معتبر نیست.' })
  }
  return `/api/addresses/${encodeURIComponent(id)}`
}

export async function readAddressInput(event: H3Event): Promise<AddressInput> {
  const body = await readBody<Partial<AddressInput>>(event)
  if (!body || typeof body.name !== 'string' || !body.name.trim()
    || typeof body.first_name !== 'string' || !body.first_name.trim()
    || typeof body.last_name !== 'string' || !body.last_name.trim()
    || typeof body.phone !== 'string' || !body.phone.trim()
    || !Number.isSafeInteger(body.province_code) || body.province_code! <= 0
    || !Number.isSafeInteger(body.city_code) || body.city_code! <= 0
    || typeof body.postal_code !== 'string' || !body.postal_code.trim()
    || typeof body.address !== 'string' || !body.address.trim()) {
    throw createError({ statusCode: 400, message: 'اطلاعات نشانی کامل نیست.' })
  }
  return {
    name: body.name.trim(), first_name: body.first_name.trim(), last_name: body.last_name.trim(), phone: body.phone.trim(),
    province_code: body.province_code!, city_code: body.city_code!,
    postal_code: body.postal_code.trim(), address: body.address.trim(),
  }
}
