import type { H3Event } from 'h3'
import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack'
import { clearCredential, resolveCredential, type AuthorizationMode } from './session'

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
    throw error
  }
}
