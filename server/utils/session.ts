import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'

export type AuthorizationMode = 'session' | 'user' | 'none'
export type CredentialKind = 'user' | 'guest'
// secure: process.env.NODE_ENV === 'production',
export const sessionCookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
}

export function resolveCredential(event?: H3Event, mode: AuthorizationMode = 'session') {
  if (!event || mode === 'none') return null
  const auth = getCookie(event, 'auth_token')
  if (auth) return { kind: 'user' as const, token: auth }
  const guest = mode === 'session' ? getCookie(event, 'guest_token') : undefined
  return guest ? { kind: 'guest' as const, token: guest } : null
}

export function clearCredential(event: H3Event, kind: CredentialKind) {
  deleteCookie(event, kind === 'user' ? 'auth_token' : 'guest_token', { path: '/' })
}

export function clearSessionCookies(event: H3Event) {
  clearCredential(event, 'user')
  clearCredential(event, 'guest')
}

export function sessionIdentity(token: string) {
  return createHash('sha256').update(token).digest('hex')
}
