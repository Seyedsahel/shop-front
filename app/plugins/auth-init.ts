export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()

  try {
    await authStore.fetchSession()
  } catch {}
})
