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
  const deadline = createRequestDeadline(resolveRequestTimeout(options.timeout, resolveRequestTimeout(config.backendRequestTimeoutMs, 20_000)), options.signal)

  try {
    return await deadline.wait($fetch<T>(url, { baseURL: `${config.backendUrl.replace(/\/+$/, '')}/tbt`, ...options, headers, signal: deadline.signal, timeout: undefined, retry: 0 }) as Promise<T>)
  } catch (error: any) {
    if (!deadline.timedOut && options.signal?.aborted) throw error
    const status = error.response?.status ?? error.statusCode ?? error.status
    // Allowlisted metadata only: paths, error bodies and messages can contain customer data.
    console.error('backend_request_failed', {
      method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(options.method ?? 'GET') ? options.method ?? 'GET' : 'OTHER',
      status: typeof status === 'number' && Number.isInteger(status) && status >= 400 && status < 600 ? status : null,
      kind: deadline.timedOut ? 'timeout' : typeof status === 'number' && status >= 400 && status < 600 ? 'http' : 'network',
    })
    if (deadline.timedOut) throw createError({ statusCode: 504, message: 'Upstream request timed out', data: { code: 'UPSTREAM_TIMEOUT' } })
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
      const validationMessage = [400, 409, 422].includes(status) && typeof error.data?.error === 'string'
        ? error.data.error : undefined
      throw createError({
        statusCode: status,
        message: validationMessage ?? 'درخواست به سرویس انجام نشد.',
        data: { ...(code ? { code } : {}), ...(validationMessage ? { validationMessage } : {}) },
      })
    }
    throw createError({ statusCode: 502, message: 'Upstream service unavailable', data: { code: 'UPSTREAM_UNAVAILABLE' } })
  } finally {
    deadline.dispose()
  }
}
