// utils/apiFetch.ts
export const apiFetch = $fetch.create({
  baseURL: '/api',
  onResponseError({ response }) {
    if (response.status === 401) {
      const authStore = useAuthStore()
      authStore.isAuthenticated = false
      authStore.user = null
    }
  }
})