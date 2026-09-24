export const useOrderStore = defineStore('orders', () => {
  const api = useApi()
  const auth = useAuthStore()
  const items = ref<OrderSummary[]>([])
  const current = ref<OrderDetail | null>(null)
  const total = ref(0)
  const page = ref(1)
  const limit = ref(20)
  const loading = ref(false)
  const detailLoading = ref(false)
  const error = ref('')
  const detailError = ref('')
  const loaded = ref(false)
  let generation = 0
  let listRequest = 0
  let detailRequest = 0

  watch(() => auth.identity, () => {
    generation++
    listRequest++
    detailRequest++
    items.value = []
    current.value = null
    total.value = 0
    page.value = 1
    loaded.value = false
    loading.value = false
    detailLoading.value = false
    error.value = ''
    detailError.value = ''
  }, { flush: 'sync' })

  async function fetchAll(nextPage = 1) {
    const identity = generation
    const request = ++listRequest
    loading.value = true
    error.value = ''
    try {
      const result = await api.get<OrderListResponse>(`/orders?page=${nextPage}`)
      if (identity !== generation || request !== listRequest) return
      items.value = result.items
      total.value = result.total
      page.value = result.page
      limit.value = result.limit
      loaded.value = true
    } catch (cause) {
      if (identity === generation && request === listRequest) error.value = cause instanceof ApiError ? cause.message : 'دریافت سفارش‌ها ناموفق بود.'
      throw cause
    } finally {
      if (identity === generation && request === listRequest) loading.value = false
    }
  }

  async function fetchOne(id: string) {
    const identity = generation
    const request = ++detailRequest
    current.value = null
    detailLoading.value = true
    detailError.value = ''
    try {
      const result = await api.get<OrderDetail>(`/orders/${encodeURIComponent(id)}`)
      if (identity !== generation || request !== detailRequest) return
      current.value = result
    } catch (cause) {
      if (identity === generation && request === detailRequest) detailError.value = cause instanceof ApiError ? cause.message : 'دریافت سفارش ناموفق بود.'
      throw cause
    } finally {
      if (identity === generation && request === detailRequest) detailLoading.value = false
    }
  }

  return { items, current, total, page, limit, loading, detailLoading, error, detailError, loaded, fetchAll, fetchOne }
})
