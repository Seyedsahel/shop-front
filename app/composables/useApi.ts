export const useApi = () => {
  async function request<T>(path: string, opts: any = {}): Promise<T> {
    try {
      const response = await $fetch<T>(path, { baseURL: '/api', ...opts })
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