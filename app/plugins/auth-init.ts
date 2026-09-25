export default defineNuxtPlugin(async (nuxtApp) => {
  const authStore = useAuthStore()
  // Reuse SSR state during hydration; subsequent tab focus checks current cookies.
  if (!(import.meta.client && nuxtApp.isHydrating && authStore.sessionChecked)) {
    try { await authStore.fetchSession() } catch {}
  }
  if (import.meta.client) {
    const refreshOnVisibility = () => {
      if (document.visibilityState !== 'visible') return
      void (authStore.isAuthenticated ? authStore.refreshSession() : authStore.fetchSession()).catch(() => {})
    }
    const refreshToken = () => {
      if (document.visibilityState === 'visible') void authStore.refreshSession().catch(() => {})
    }
    const refreshInterval = window.setInterval(refreshToken, 10 * 60 * 1_000)
    document.addEventListener('visibilitychange', refreshOnVisibility)
    nuxtApp.vueApp.onUnmount(() => {
      window.clearInterval(refreshInterval)
      document.removeEventListener('visibilitychange', refreshOnVisibility)
    })
  }
})
