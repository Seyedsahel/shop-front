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
  let fetchPromise: Promise<void> | null = null
  const busy = computed(() => isLoading.value || isMutating.value)
  const items = computed(() => Object.values(wishlist.value?.products ?? {}))
  const itemCount = computed(() => items.value.length)

  function findItem(productId: string, variantId?: string | null) {
    return items.value.find(item => item.product_id === productId && (item.variant_id || '') === (variantId || ''))
  }

  watch(() => auth.identity, () => {
    epoch++
    wishlist.value = null
    loaded.value = false
    stale.value = false
    error.value = ''
    if (import.meta.client && !busy.value) void fetchWishlist().catch(() => {})
  }, { flush: 'sync' })

  async function readWishlist(activeEpoch: number) {
    const response = await api.get<WishlistResponse>('/wishlist')
    if (epoch !== activeEpoch) throw new ApiError('نشست خرید تغییر کرده است؛ دوباره تلاش کنید.')
    wishlist.value = response
    loaded.value = true
    stale.value = false
    error.value = ''
  }

  function fetchWishlist(): Promise<void> {
    if (fetchPromise) return fetchPromise
    if (isMutating.value) return Promise.resolve()
    isLoading.value = true
    error.value = ''
    fetchPromise = auth.withShoppingSession(false, async session => {
      if (!session.identity) {
        wishlist.value = null
        loaded.value = true
        stale.value = false
        return
      }
      await readWishlist(epoch)
    }).catch(caught => {
      error.value = caught instanceof ApiError ? caught.message : 'دریافت علاقه‌مندی‌ها ناموفق بود.'
      stale.value = true
      throw caught
    }).finally(() => {
      isLoading.value = false
      fetchPromise = null
    })
    return fetchPromise
  }

  async function mutate(action: () => Promise<unknown>, create = false) {
    if (busy.value) throw new ApiError('لطفاً تا پایان عملیات علاقه‌مندی‌ها صبر کنید.')
    if (stale.value) throw new ApiError('ابتدا علاقه‌مندی‌ها را دوباره دریافت کنید.')
    isMutating.value = true
    error.value = ''
    const startingIdentity = auth.identity
    try {
      await auth.withShoppingSession(create, async session => {
        if (!session.identity || (!create && session.identity !== startingIdentity)) {
          throw new ApiError('نشست خرید تغییر کرده است؛ علاقه‌مندی‌ها را دوباره دریافت کنید.')
        }
        const activeEpoch = epoch
        await action()
        try {
          await readWishlist(activeEpoch)
        } catch {
          stale.value = true
          throw new ApiError('تغییر ثبت شد، اما دریافت علاقه‌مندی‌ها ناموفق بود. فقط دریافت علاقه‌مندی‌ها را دوباره امتحان کنید.', undefined, 'WISHLIST_REFRESH_FAILED')
        }
      })
    } catch (caught) {
      stale.value = true
      error.value = caught instanceof ApiError ? caught.message : 'تغییر علاقه‌مندی‌ها ناموفق بود.'
      throw caught
    } finally {
      isMutating.value = false
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

  return { wishlist, items, itemCount, findItem, isLoading, isMutating, busy, loaded, stale, error, fetchWishlist, addItem, remove, clear }
})
