import type { H3Event } from 'h3'

export function requireNotificationUser(event: H3Event) {
  setHeader(event, 'Cache-Control', 'private, no-store')
  if (!resolveCredential(event, 'user')) {
    throw createError({ statusCode: 401, message: 'ورود به حساب کاربری لازم است.' })
  }
}
