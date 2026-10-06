import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack'

export const useApi = () => {
  const event = import.meta.server ? useRequestEvent() : undefined
  const forwardedHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
  const authStore = useAuthStore()
  const config = useRuntimeConfig()

  async function request<T>(path: string, opts: NitroFetchOptions<NitroFetchRequest> = {}): Promise<T> {
    const revision = authStore.sessionRevision
    const headers = new Headers(forwardedHeaders)
    new Headers(opts.headers).forEach((value, key) => headers.set(key, value))
    // Credentials are selected only by the server transport.
    headers.delete('Authorization')
    const deadline = createRequestDeadline(resolveRequestTimeout(opts.timeout, resolveRequestTimeout(config.public?.apiRequestTimeoutMs, 30_000)), opts.signal)
    try {
      return await deadline.wait($fetch<T>(path, {
        ...opts,
        baseURL: '/api',
        headers,
        signal: deadline.signal,
        retry: 0,
        timeout: undefined,
        async onResponse({ response }) {
          if (import.meta.server && event && !deadline.signal.aborted) {
            const { appendResponseHeader } = await import('h3')
            for (const cookie of response.headers.getSetCookie()) {
              appendResponseHeader(event, 'set-cookie', cookie)
            }
          }
        },
      }) as Promise<T>)
    } catch (error: any) {
      const status = error.response?.status ?? error.statusCode ?? error.status
      const code = error.data?.data?.code
      const timeout = deadline.timedOut || code === 'UPSTREAM_TIMEOUT'
      const kind = timeout ? 'timeout' : opts.signal?.aborted ? 'cancelled' : typeof status === 'number' ? 'http' : 'network'
      if (kind !== 'cancelled' && revision === authStore.sessionRevision) authStore.handleSessionError(code)
      const validationMessage = error.data?.data?.validationMessage
      throw createTransportApiError(typeof status === 'number' ? status : undefined, code, kind,
        typeof validationMessage === 'string' ? validationMessage : undefined)
    } finally {
      deadline.dispose()
    }
  }

  return {
    patch: <T>(path: string, body?: NitroFetchOptions<NitroFetchRequest>['body']) => request<T>(path, { method: 'PATCH', body, retry: 0 }),
    put: <T>(path: string, body?: NitroFetchOptions<NitroFetchRequest>['body']) => request<T>(path, { method: 'PUT', body, retry: 0 }),
    delete: <T>(path: string) => request<T>(path, { method: 'DELETE', retry: 0 }),
    get: <T>(path: string, options: Pick<NitroFetchOptions<NitroFetchRequest>, 'headers' | 'signal' | 'timeout'> = {}) => request<T>(path, options),
    post: <T>(path: string, body?: NitroFetchOptions<NitroFetchRequest>['body'], options: Pick<NitroFetchOptions<NitroFetchRequest>, 'headers' | 'signal' | 'timeout'> = {}) => request<T>(path, { ...options, method: 'POST', body, retry: 0 }),
  }
}
