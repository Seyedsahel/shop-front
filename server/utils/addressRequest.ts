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
  return `/addresses/${encodeURIComponent(id)}`
}

export async function readAddressInput(event: H3Event): Promise<AddressWriteInput> {
  const body = await readBody<AddressWriteInput>(event)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 400, message: 'اطلاعات نشانی معتبر نیست.' })
  }
  const input: AddressWriteInput = {}
  for (const field of ['name', 'first_name', 'last_name', 'phone', 'postal_code', 'address'] as const) {
    const value = body[field]
    if (value === undefined) continue
    if (typeof value !== 'string' || !value.trim()) {
      throw createError({ statusCode: 400, message: 'اطلاعات نشانی معتبر نیست.' })
    }
    input[field] = value.trim()
  }
  for (const field of ['province_code', 'city_code'] as const) {
    const value = body[field]
    if (value === undefined) continue
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw createError({ statusCode: 400, message: 'اطلاعات نشانی معتبر نیست.' })
    }
    input[field] = value
  }
  if (!Object.keys(input).length) throw createError({ statusCode: 400, message: 'اطلاعات نشانی کامل نیست.' })
  return input
}
