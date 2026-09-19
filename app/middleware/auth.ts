export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.sessionChecked) {
    try {
      await authStore.fetchSession()
    } catch {
      // A failed session check does not grant access.
    }
  }

  if (!authStore.isAuthenticated) {
    return navigateTo({ path: '/auth', query: { redirect: to.fullPath } })
  }
})
