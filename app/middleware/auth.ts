export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.sessionChecked) {
    try {
      await authStore.fetchSession()
    } catch {
      // The session store has already reset its state.
    }
  }

  if (!authStore.isAuthenticated) {
    return navigateTo({ path: '/auth', query: { redirect: to.fullPath } })
  }
})
