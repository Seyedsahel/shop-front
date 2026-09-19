export default defineNuxtPlugin(async (nuxtApp) => {
  const authStore = useAuthStore()
  // Reuse SSR state during hydration; subsequent tab focus checks current cookies.
  if (!(import.meta.client && nuxtApp.isHydrating && authStore.sessionChecked)) {
    try { await authStore.fetchSession() } catch {}
  }
  if (import.meta.client) {
    const refresh = () => {
      if (document.visibilityState === 'visible') void authStore.fetchSession().catch(() => {})
    }
    document.addEventListener('visibilitychange', refresh)
    nuxtApp.vueApp.onUnmount(() => document.removeEventListener('visibilitychange', refresh))
  }
})
