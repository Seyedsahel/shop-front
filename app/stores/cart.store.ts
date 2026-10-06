export const useCartStore = defineStore('cart', () => {
  const auth = useAuthStore()
  const api = useApi()
  const cart = ref<CartResponse | null>(null)
  const isLoading = ref(false)
  const isMutating = ref(false)
  const loaded = ref(false)
  const stale = ref(false)
  const error = ref('')
  let epoch = 0
  let refreshChangedScope = false
  const publish = useSessionSync()
  const busy = computed(() => isLoading.value || isMutating.value)
  const items = computed(() => Object.values(cart.value?.products ?? {}))
  const itemCount = computed(() => items.value.length)
  const subtotalOriginal = computed(() => cart.value?.pricing.subtotal_original ?? 0)
  const subtotal = computed(() => cart.value?.pricing.subtotal ?? 0)
  const discount = computed(() => cart.value?.pricing.discount ?? 0)
  const total = computed(() => cart.value?.pricing.total ?? 0)

  function itemsForProduct(productId: string) {
    return items.value.filter(item => item.product_id === productId)
  }

  watch(() => auth.sessionScope ?? auth.identity, () => {
    epoch++
    cart.value = null
    loaded.value = false
    stale.value = false
    error.value = ''
    if (import.meta.client) {
      if (isMutating.value) refreshChangedScope = true
      else void revalidateCart().catch(() => {})
    }
  }, { flush: 'sync' })

  async function readCart(activeEpoch: number) {
    const response = await api.get<CartResponse>('/cart')
    if (epoch !== activeEpoch) throw new ApiError('نشست خرید تغییر کرده است؛ دوباره تلاش کنید.')
    cart.value = response
    loaded.value = true
    stale.value = false
    error.value = ''
    refreshChangedScope = false
  }

  const refresh = useResourceRefresh(async () => {
    let activeEpoch = epoch
    isLoading.value = true
    error.value = ''
    try {
      await auth.withShoppingSession(false, async session => {
        activeEpoch = epoch
        if (!session.identity) {
          cart.value = null
          loaded.value = true
          stale.value = false
          refreshChangedScope = false
          return
        }
        await readCart(activeEpoch)
      })
    } catch (caught) {
      if (activeEpoch === epoch) {
        error.value = caught instanceof ApiError ? caught.message : 'دریافت سبد خرید ناموفق بود.'
        stale.value = true
      }
      throw caught
    } finally {
      isLoading.value = false
    }
  }, isMutating)

  function fetchCart() { return refresh.request() }
  function revalidateCart() { return refresh.request(true) }

  async function mutate(action: () => Promise<unknown>, create = false) {
    if (busy.value) throw new ApiError('لطفاً تا پایان عملیات سبد خرید صبر کنید.')
    if (stale.value) throw new ApiError('ابتدا سبد خرید را دوباره دریافت کنید.')
    isMutating.value = true
    error.value = ''
    const startingScope = auth.sessionScope ?? auth.identity
    let activeEpoch = epoch
    try {
      await auth.withShoppingSession(create, async session => {
        const sessionScope = session.scope ?? session.identity
        if (!sessionScope || (!create && sessionScope !== startingScope)) {
          throw new ApiError('نشست خرید تغییر کرده است؛ سبد را دوباره دریافت کنید.')
        }
        activeEpoch = epoch
        await action()
        publish('cart')
        try {
          await readCart(activeEpoch)
        } catch {
          if (activeEpoch === epoch) stale.value = true
          throw new ApiError('تغییر ثبت شد، اما دریافت سبد جدید ناموفق بود. فقط دریافت سبد را دوباره امتحان کنید.', undefined, 'CART_REFRESH_FAILED')
        }
      })
    } catch (caught) {
      const contextualError = withApiErrorContext(caught, 'cartMutation')
      if (activeEpoch === epoch) error.value = getUserFriendlyApiErrorMessage(contextualError, 'cartMutation')
      throw contextualError
    } finally {
      isMutating.value = false
      if (refreshChangedScope) {
        refreshChangedScope = false
        void revalidateCart().catch(() => {})
      }
    }
  }

  function addItem(productId: string, quantity: number, variantId: string | null) {
    if (!Number.isSafeInteger(quantity) || quantity < 1) return Promise.reject(new ApiError('تعداد معتبر نیست.'))
    return mutate(() => api.post('/cart/items', { product_id: productId, quantity, variant_id: variantId } satisfies CartItemPayload), true)
  }
  function updateQuantity(id: string, quantity: number) {
    const item = cart.value?.products[id]
    if (!item || !Number.isSafeInteger(quantity) || quantity < 1) return Promise.reject(new ApiError('کالا یا تعداد معتبر نیست.'))
    if (item.max_per_order > 0 && quantity > item.max_per_order) {
      return Promise.reject(new ApiError('شما به محدودیت تعداد انتخابی برای سفارش این محصول رسیدید.'))
    }
    return mutate(() => api.patch(`/cart/items/${encodeURIComponent(id)}`, {
      product_id: item.product_id, variant_id: item.variant_id?.trim() || null, quantity,
    } satisfies CartItemPayload))
  }
  function remove(id: string) {
    return mutate(() => api.delete(`/cart/items/${encodeURIComponent(id)}`))
  }
  function clear() { return mutate(() => api.delete('/cart')) }

  return { cart, items, itemsForProduct, itemCount, subtotalOriginal, subtotal, discount, total, isLoading, isMutating, busy, loaded, stale, error, fetchCart, revalidateCart, addItem, updateQuantity, remove, clear }
})
