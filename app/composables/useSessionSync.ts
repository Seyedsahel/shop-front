/** Publish an invalidation hint, never session credentials or resource contents. */
export function useSessionSync() {
  const app = useNuxtApp()
  return (resource: SessionResource) => {
    if (import.meta.client) void app.callHook('session:invalidate', resource)
  }
}
