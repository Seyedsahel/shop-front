export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()

  try {
    await authStore.fetchSession()
  } catch {
    authStore.isAuthenticated = false
    authStore.user = null
  }
})