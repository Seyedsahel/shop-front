// composables/useApi.ts
export const useApi = () => {
  // must run synchronously here, not inside the async request() body,
  // or Nuxt's request context may already be lost after an await
  const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined

  async function request<T>(path: string, opts: any = {}): Promise<T> {
    try {
      const response = await $fetch<T>(path, {
        baseURL: '/api',
        headers: { ...headers, ...opts.headers },
        ...opts,
      })
      return response as T
    } catch (e: any) {
      if (e.response?.status === 401) {
        const authStore = useAuthStore()
        authStore.isAuthenticated = false
        authStore.user = null
      }
      throw new ApiError(e.data?.message ?? 'خطای غیرمنتظره رخ داد.', e.response?.status)
    }
  }

  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  }
}