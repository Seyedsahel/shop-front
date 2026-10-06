export const useWishlistStore = defineStore('wishlist', () => {
  const auth = useAuthStore()
  const api = useApi()
  const wishlist = ref<WishlistResponse | null>(null)
  const isLoading = ref(false)
  const isMutating = ref(false)
  const loaded = ref(false)
  const stale = ref(false)
  const error = ref('')
  let epoch = 0
  let refreshChangedScope = false
  const publish = useSessionSync()
  const busy = computed(() => isLoading.value || isMutating.value)
  const items = computed(() => Object.values(wishlist.value?.products ?? {}))
  const itemCount = computed(() => items.value.length)

  function findItem(productId: string, variantId?: string | null) {
    return items.value.find(item => item.product_id === productId && (item.variant_id || '') === (variantId || ''))
  }

  watch(() => auth.sessionScope ?? auth.identity, () => {
    epoch++
    wishlist.value = null
    loaded.value = false
    stale.value = false
    error.value = ''
    if (import.meta.client) {
      if (isMutating.value) refreshChangedScope = true
      else void revalidateWishlist().catch(() => {})
    }
  }, { flush: 'sync' })

  async function readWishlist(activeEpoch: number) {
    const response = await api.get<WishlistResponse>('/wishlist')
    if (epoch !== activeEpoch) throw new ApiError('نشست خرید تغییر کرده است؛ دوباره تلاش کنید.')
    wishlist.value = response
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
          wishlist.value = null
          loaded.value = true
          stale.value = false
          refreshChangedScope = false
          return
        }
        await readWishlist(activeEpoch)
      })
    } catch (caught) {
      if (activeEpoch === epoch) {
        error.value = caught instanceof ApiError ? caught.message : 'دریافت علاقه‌مندی‌ها ناموفق بود.'
        stale.value = true
      }
      throw caught
    } finally {
      isLoading.value = false
    }
  }, isMutating)

  function fetchWishlist() { return refresh.request() }
  function revalidateWishlist() { return refresh.request(true) }

  async function mutate(action: () => Promise<unknown>, create = false) {
    if (busy.value) throw new ApiError('لطفاً تا پایان عملیات علاقه‌مندی‌ها صبر کنید.')
    if (stale.value) throw new ApiError('ابتدا علاقه‌مندی‌ها را دوباره دریافت کنید.')
    isMutating.value = true
    error.value = ''
    const startingScope = auth.sessionScope ?? auth.identity
    let activeEpoch = epoch
    try {
      await auth.withShoppingSession(create, async session => {
        const sessionScope = session.scope ?? session.identity
        if (!sessionScope || (!create && sessionScope !== startingScope)) {
          throw new ApiError('نشست خرید تغییر کرده است؛ علاقه‌مندی‌ها را دوباره دریافت کنید.')
        }
        activeEpoch = epoch
        await action()
        publish('wishlist')
        try {
          await readWishlist(activeEpoch)
        } catch {
          if (activeEpoch === epoch) stale.value = true
          throw new ApiError('تغییر ثبت شد، اما دریافت علاقه‌مندی‌ها ناموفق بود. فقط دریافت علاقه‌مندی‌ها را دوباره امتحان کنید.', undefined, 'WISHLIST_REFRESH_FAILED')
        }
      })
    } catch (caught) {
      if (activeEpoch === epoch) {
        stale.value = true
        error.value = caught instanceof ApiError ? caught.message : 'تغییر علاقه‌مندی‌ها ناموفق بود.'
      }
      throw caught
    } finally {
      isMutating.value = false
      if (refreshChangedScope) {
        refreshChangedScope = false
        void revalidateWishlist().catch(() => {})
      }
    }
  }

  function addItem(productId: string, variantId?: string | null) {
    if (!productId.trim()) return Promise.reject(new ApiError('شناسه محصول معتبر نیست.'))
    const body: WishlistItemPayload = {
      product_id: productId,
      ...(variantId ? { variant_id: variantId } : {}),
    }
    return mutate(() => api.post('/wishlist/items', body), true)
  }

  function remove(id: string) {
    return mutate(() => api.delete(`/wishlist/items/${encodeURIComponent(id)}`))
  }

  function clear() { return mutate(() => api.delete('/wishlist')) }

  return { wishlist, items, itemCount, findItem, isLoading, isMutating, busy, loaded, stale, error, fetchWishlist, revalidateWishlist, addItem, remove, clear }
})
