export default defineNuxtPlugin(async (nuxtApp) => {
  const auth = useAuthStore()
  if (!(import.meta.client && nuxtApp.isHydrating && auth.sessionChecked)) {
    try { await auth.fetchSession() } catch {}
  }
  if (!import.meta.client) return

  const router = useRouter()
  const cart = useCartStore()
  const wishlist = useWishlistStore()
  const addresses = useAddressStore()
  const orders = useOrderStore()
  const checkout = useCheckoutStore()
  const payments = usePaymentStore()
  watch([() => orders.current, () => orders.items], ([current, items]) => {
    if (current) checkout.cleanupCompletedAttempt(current)
    for (const order of items) checkout.cleanupCompletedAttempt(order)
  }, { immediate: true })
  const resources: SessionResource[] = ['cart', 'wishlist', 'addresses', 'orders']
  const allowed = new Set<SessionResource>(['session', ...resources])
  const pending = new Set<SessionResource>()
  let rotate = false
  let disposed = false
  let running: Promise<void> | null = null
  let channel: BroadcastChannel | undefined
  const storageKey = 'shop:session-invalidation:v1'

  const cartRefresh = useResourceRefresh(() => cart.revalidateCart(), computed(() => checkout.submitting))

  const orderRefresh = useResourceRefresh(async () => {
    if (!auth.isAuthenticated) return
    const route = router.currentRoute.value
    const reads: Promise<unknown>[] = []
    if (orders.requested || route.path === '/profile') reads.push(orders.revalidate())
    if (route.path.startsWith('/profile/orders/') && typeof route.params.id === 'string') {
      reads.push(orders.fetchOne(route.params.id, true))
    } else if (['/pay/success', '/pay/failure'].includes(route.path) && typeof route.query.order_id === 'string' && route.query.order_id.trim()) {
      reads.push(orders.fetchOne(route.query.order_id.trim(), true))
    }
    await Promise.allSettled(reads)
  }, computed(() => checkout.submitting || payments.starting))

  async function refreshResources(selected: Set<SessionResource>) {
    const route = router.currentRoute.value
    const all = selected.has('session')
    const reads: Promise<unknown>[] = []
    if ((all || selected.has('cart')) && (cart.loaded || cart.busy || ['/cart', '/checkout'].includes(route.path))) reads.push(cartRefresh.request(true))
    if ((all || selected.has('wishlist')) && (wishlist.loaded || wishlist.busy || route.path === '/wishlist')) reads.push(wishlist.revalidateWishlist())
    if (auth.isAuthenticated) {
      if ((all || selected.has('addresses')) && (addresses.requested || ['/profile', '/checkout'].includes(route.path))) reads.push(addresses.revalidate())
      if (all || selected.has('orders')) reads.push(orderRefresh.request())
    } else if (route.path === '/checkout' || route.path.startsWith('/profile')) {
      // Route middleware does not rerun just because shared cookies changed.
      void router.replace({ path: '/auth', query: { redirect: route.fullPath } })
    }
    await Promise.allSettled(reads)
  }

  function synchronize(selected: SessionResource[] = ['session'], refreshToken = false): Promise<void> {
    selected.forEach(resource => pending.add(resource))
    rotate ||= refreshToken
    if (disposed || document.visibilityState !== 'visible') return Promise.resolve()
    if (running) return running
    running = (async () => {
      while (!disposed && document.visibilityState === 'visible' && pending.size) {
        const selected = new Set(pending)
        const shouldRotate = rotate
        pending.clear()
        rotate = false
        try {
          // Always validate the cookies currently shared by tabs first.
          await auth.fetchSession()
          if (shouldRotate && auth.isAuthenticated) await auth.refreshSession()
        } catch {
          selected.forEach(resource => pending.add(resource))
          rotate ||= shouldRotate
          return // Retry on the next signal, rather than polling an offline service.
        }
        if (!disposed) await refreshResources(selected)
      }
    })().finally(() => { running = null })
    return running
  }

  function receive(data: unknown) {
    if (!data || typeof data !== 'object') return
    const hint = data as { version?: unknown; resource?: unknown }
    if (hint.version !== 1 || typeof hint.resource !== 'string' || !allowed.has(hint.resource as SessionResource)) return
    void synchronize([hint.resource as SessionResource])
  }

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel('shop-session-v1')
      channel.onmessage = event => receive(event.data)
    }
  } catch { /* Storage events still provide an invalidation fallback. */ }

  const removePublishHook = nuxtApp.hook('session:invalidate', resource => {
    const hint = { version: 1, resource }
    if (channel) channel.postMessage(hint)
    else {
      try { localStorage.setItem(storageKey, JSON.stringify({ ...hint, nonce: `${Date.now()}-${Math.random()}` })) }
      catch { /* Visibility validation remains available when storage is disabled. */ }
    }
    // Checkout/payment can change an already-loaded order list in this tab too.
    if (resource === 'orders') void synchronize(['orders', 'cart'])
  })
  const onStorage = (event: StorageEvent) => {
    if (event.key !== storageKey || !event.newValue) return
    try { receive(JSON.parse(event.newValue)) } catch {}
  }
  const onVisibility = () => { if (document.visibilityState === 'visible') void synchronize() }
  const refreshInterval = window.setInterval(() => {
    if (document.visibilityState === 'visible') void synchronize(['session'], true)
  }, 10 * 60 * 1_000)
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('storage', onStorage)
  nuxtApp.vueApp.onUnmount(() => {
    disposed = true
    removePublishHook()
    channel?.close()
    window.clearInterval(refreshInterval)
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('storage', onStorage)
  })
})
