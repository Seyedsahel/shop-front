import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack'

export const useApi = () => {
  const event = import.meta.server ? useRequestEvent() : undefined
  const forwardedHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
  const authStore = useAuthStore()

  async function request<T>(path: string, opts: NitroFetchOptions<NitroFetchRequest> = {}): Promise<T> {
    const revision = authStore.sessionRevision
    const headers = new Headers(forwardedHeaders)
    new Headers(opts.headers).forEach((value, key) => headers.set(key, value))
    // Credentials are selected only by the server transport.
    headers.delete('Authorization')
    try {
      return await $fetch<T>(path, {
        ...opts,
        baseURL: '/api',
        headers,
        async onResponse({ response }) {
          if (import.meta.server && event) {
            const { appendResponseHeader } = await import('h3')
            for (const cookie of response.headers.getSetCookie()) {
              appendResponseHeader(event, 'set-cookie', cookie)
            }
          }
        },
      }) as T
    } catch (error: any) {
      const status = error.response?.status ?? error.statusCode ?? error.status
      const code = error.data?.data?.code
      const timeout = error.name === 'TimeoutError' || error.code === 'ETIMEDOUT'
      const kind = timeout ? 'timeout' : typeof status === 'number' ? 'http' : 'network'
      if (revision === authStore.sessionRevision) authStore.handleSessionError(code)
      throw createTransportApiError(typeof status === 'number' ? status : undefined, code, kind)
    }
  }

  return {
    patch: <T>(path: string, body?: NitroFetchOptions<NitroFetchRequest>['body']) => request<T>(path, { method: 'PATCH', body, retry: 0 }),
    put: <T>(path: string, body?: NitroFetchOptions<NitroFetchRequest>['body']) => request<T>(path, { method: 'PUT', body, retry: 0 }),
    delete: <T>(path: string) => request<T>(path, { method: 'DELETE', retry: 0 }),
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: NitroFetchOptions<NitroFetchRequest>['body']) => request<T>(path, { method: 'POST', body }),
  }
}
