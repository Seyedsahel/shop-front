import type { H3Event } from 'h3'
import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack'
import { clearCredential, resolveCredential, type AuthorizationMode } from './session'

function backendErrorMessage(data: unknown): string | null {
  if (typeof data === 'string') return data.trim() || null
  if (!data || typeof data !== 'object') return null
  const body = data as Record<string, unknown>
  for (const key of ['message', 'error', 'detail', 'title']) {
    const value = body[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (value && typeof value === 'object') {
      const nested = backendErrorMessage(value)
      if (nested) return nested
    }
  }
  return null
}

export const backendFetch = async <T = unknown>(
  url: string,
  opts: NitroFetchOptions<NitroFetchRequest> & { authorization?: AuthorizationMode } = {},
  event?: H3Event,
): Promise<T> => {
  const config = useRuntimeConfig(event)
  const { authorization = 'session', ...options } = opts
  const credential = resolveCredential(event, authorization)
  if (event && credential?.kind === 'user' && getCookie(event, 'guest_token')) clearCredential(event, 'guest')
  const headers = new Headers(options.headers)
  headers.delete('Authorization')
  if (credential) headers.set('Authorization', `Bearer ${credential.token}`)

  try {
    return await $fetch<T>(url, { baseURL: config.backendUrl, ...options, headers }) as T
  } catch (error: any) {
    if (error.response?.status === 401 && event && credential) {
      clearCredential(event, credential.kind)
      throw createError({
        statusCode: 401,
        message: 'Session expired',
        data: { code: credential.kind === 'user' ? 'AUTH_SESSION_EXPIRED' : 'GUEST_SESSION_EXPIRED' },
      })
    }
    const status = error.response?.status
    if (typeof status === 'number' && status >= 400 && status < 600) {
      throw createError({
        statusCode: status,
        message: status < 500
          ? backendErrorMessage(error.data) ?? 'درخواست توسط سرویس رد شد.'
          : 'سرویس در حال حاضر پاسخ‌گو نیست.',
        ...(status < 500 ? { data: { upstream: error.data ?? null } } : {}),
      })
    }
    throw error
  }
}
