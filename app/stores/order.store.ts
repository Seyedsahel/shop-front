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
  const requested = ref(false)
  const requestedPage = ref(1)
  const requestedId = ref<string | null>(null)
  let generation = 0
  let listRequest = 0
  let detailRequest = 0
  let requestedDetailScope: string | null | undefined

  watch(() => auth.sessionScope ?? auth.identity, () => {
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
    if (import.meta.client && requested.value) void revalidate().catch(() => {})
  }, { flush: 'sync' })

  const listRefresh = useResourceRefresh(async () => {
    if (!auth.isAuthenticated) return
    const nextPage = requestedPage.value
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
  })

  function fetchAll(nextPage = 1) {
    const changed = requested.value && requestedPage.value !== nextPage
    if (changed) listRequest++
    requested.value = true
    requestedPage.value = nextPage
    return listRefresh.request(changed)
  }
  function revalidate() { return listRefresh.request(true) }

  const oneRefresh = useResourceRefresh(async () => {
    const id = requestedId.value
    if (!auth.isAuthenticated || !id) return
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
  })

  function fetchOne(id: string, fresh = false) {
    const scope = auth.sessionScope ?? auth.identity
    const changed = requestedId.value !== id || requestedDetailScope !== scope
    if (changed) detailRequest++
    requestedId.value = id
    requestedDetailScope = scope
    return oneRefresh.request(fresh || changed)
  }

  return { items, current, total, page, limit, loading, detailLoading, error, detailError, loaded, requested, requestedPage, requestedId, fetchAll, revalidate, fetchOne }
})
