export const useNotificationStore = defineStore('notifications', () => {
  const api = useApi()
  const auth = useAuthStore()
  const items = ref<AppNotification[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(20)
  const mutating = ref(false)
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref('')
  const counts = ref<NotificationCounts>({ by_object_type: {}, unread_total: 0 })
  const countsLoading = ref(false)
  const countsError = ref('')
  const latest = ref<AppNotification[]>([])
  const latestLoading = ref(false)
  const latestError = ref('')
  let generation = 0
  let countsRequested = false
  let listRequested = false
  let latestRequested = false
  let requestedPage = 1
  let listRevision = 0
  let countsRevision = 0

  watch(() => auth.sessionScope ?? auth.identity, () => {
    generation++
    listRevision++
    countsRevision++
    requestedPage = 1
    page.value = 1
    items.value = []
    total.value = 0
    loading.value = false
    loaded.value = false
    error.value = ''
    latest.value = []
    latestLoading.value = false
    latestError.value = ''
    counts.value = { by_object_type: {}, unread_total: 0 }
    countsLoading.value = false
    countsError.value = ''
    if (import.meta.client && countsRequested && auth.isAuthenticated) void fetchCounts(true).catch(() => {})
    if (import.meta.client && listRequested && auth.isAuthenticated) void fetchAll(1, true).catch(() => {})
    if (import.meta.client && latestRequested && auth.isAuthenticated) void fetchLatest(true).catch(() => {})
  }, { flush: 'sync' })

  const countsRefresh = useResourceRefresh(async () => {
    if (!auth.isAuthenticated) return
    const identity = generation
    const revision = countsRevision
    countsLoading.value = true
    countsError.value = ''
    try {
      const result = await api.get<NotificationCounts>('/notifications/counts')
      if (identity === generation && revision === countsRevision) counts.value = result
    } catch (cause) {
      if (identity === generation && revision === countsRevision) countsError.value = cause instanceof ApiError ? cause.message : 'دریافت تعداد اعلان‌ها ناموفق بود.'
      throw cause
    } finally {
      if (identity === generation) countsLoading.value = false
    }
  }, mutating)

  function fetchCounts(fresh = false) {
    countsRequested = true
    return countsRefresh.request(fresh)
  }

  const listRefresh = useResourceRefresh(async () => {
    if (!auth.isAuthenticated) return
    const identity = generation
    const revision = listRevision
    loading.value = true
    error.value = ''
    try {
      const result = await api.get<NotificationListResponse>(`/notifications?page=${requestedPage}&limit=${limit.value}`)
      if (identity !== generation || revision !== listRevision) return
      items.value = result.items
      total.value = result.total
      page.value = result.page
      limit.value = result.limit
      loaded.value = true
    } catch (cause) {
      if (identity === generation && revision === listRevision) error.value = cause instanceof ApiError ? cause.message : 'دریافت اعلان‌ها ناموفق بود.'
      throw cause
    } finally {
      if (identity === generation) loading.value = false
    }
  }, mutating)

  function fetchAll(nextPage = page.value, fresh = false) {
    const changed = requestedPage !== nextPage
    if (changed) listRevision++
    requestedPage = nextPage
    listRequested = true
    return listRefresh.request(fresh || changed)
  }

  const latestRefresh = useResourceRefresh(async () => {
    if (!auth.isAuthenticated) return
    const identity = generation
    const revision = listRevision
    latestLoading.value = true
    latestError.value = ''
    try {
      const result = await api.get<NotificationListResponse>('/notifications?page=1&limit=3')
      if (identity !== generation || revision !== listRevision) return
      latest.value = [...result.items].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 3)
    } catch (cause) {
      if (identity === generation && revision === listRevision) latestError.value = cause instanceof ApiError ? cause.message : 'دریافت اعلان‌ها ناموفق بود.'
      throw cause
    } finally {
      if (identity === generation) latestLoading.value = false
    }
  }, mutating)

  function fetchLatest(fresh = false) {
    latestRequested = true
    return latestRefresh.request(fresh)
  }

  async function markRead(id?: string) {
    if (!auth.isAuthenticated || mutating.value) throw new ApiError('لطفاً تا پایان عملیات صبر کنید.')
    const identity = generation
    mutating.value = true
    try {
      await api.post<void>(id ? `/notifications/${encodeURIComponent(id)}/read` : '/notifications/read-all')
      if (identity !== generation) throw new ApiError('نشست کاربری تغییر کرده است؛ اعلان‌ها را دوباره دریافت کنید.')
      listRevision++
      countsRevision++
      const readAt = new Date().toISOString()
      const target = id ? [...items.value, ...latest.value].find(item => item.id === id) : undefined
      if (target && !target.read_at) {
        counts.value.unread_total = Math.max(0, counts.value.unread_total - 1)
        const count = counts.value.by_object_type[target.object_type]
        if (count !== undefined) counts.value.by_object_type[target.object_type] = Math.max(0, count - 1)
      }
      for (const item of [...items.value, ...latest.value]) {
        if ((!id || item.id === id) && !item.read_at) {
          item.read_at = readAt
        }
      }
      if (!id) counts.value = { unread_total: 0, by_object_type: {} }
    } finally {
      mutating.value = false
    }
    // Refresh server state without turning a successful write into a failure.
    void fetchCounts(true).catch(() => {})
    if (listRequested) void fetchAll(requestedPage, true).catch(() => {})
    if (latestRequested) void fetchLatest(true).catch(() => {})
  }

  return { items, total, page, limit, mutating, loading, loaded, error, latest, latestLoading, latestError, counts, countsLoading, countsError, fetchCounts, fetchAll, fetchLatest, markRead }
})
