import type { H3Event } from 'h3'
import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack'
import { clearCredential, resolveCredential, type AuthorizationMode } from './session'

function backendErrorCode(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const body = data as Record<string, unknown>
  if (typeof body.code === 'string') return body.code
  if (body.data && typeof body.data === 'object' && typeof (body.data as Record<string, unknown>).code === 'string') {
    return (body.data as Record<string, unknown>).code as string
  }
  return undefined
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
    const status = error.response?.status ?? error.statusCode ?? error.status
    if (status === 401 && event && credential) {
      clearCredential(event, credential.kind)
      throw createError({
        statusCode: 401,
        message: 'Session expired',
        data: { code: credential.kind === 'user' ? 'AUTH_SESSION_EXPIRED' : 'GUEST_SESSION_EXPIRED' },
      })
    }
    if (typeof status === 'number' && status >= 400 && status < 600) {
      const code = backendErrorCode(error.data)
      throw createError({
        statusCode: status,
        message: 'درخواست به سرویس انجام نشد.',
        ...(code ? { data: { code } } : {}),
      })
    }
    throw error
  }
}
