import type { H3Event } from 'h3'

export function requireOrderUser(event: H3Event) {
  setHeader(event, 'Cache-Control', 'no-store')
  if (!resolveCredential(event, 'user')) {
    throw createError({ statusCode: 401, message: 'ورود به حساب کاربری لازم است.' })
  }
}

export function orderPath(event: H3Event) {
  const id = getRouterParam(event, 'orderId')
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw createError({ statusCode: 400, message: 'شناسه سفارش معتبر نیست.' })
  }
  return `/orders/${encodeURIComponent(id)}`
}
