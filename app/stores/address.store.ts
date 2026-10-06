export const useAddressStore = defineStore('addresses', () => {
  const api = useApi()
  const auth = useAuthStore()
  const items = ref<Address[]>([])
  const loading = ref(false)
  const mutating = ref(false)
  const loaded = ref(false)
  const error = ref('')
  const requested = ref(false)
  const publish = useSessionSync()
  let generation = 0
  let listRevision = 0

  watch(() => auth.sessionScope ?? auth.identity, () => {
    generation++
    listRevision++
    items.value = []
    loaded.value = false
    loading.value = false
    error.value = ''
    if (import.meta.client && requested.value) void revalidate().catch(() => {})
  }, { flush: 'sync' })

  const refresh = useResourceRefresh(async () => {
    if (!auth.isAuthenticated) return
    const current = generation
    const revision = listRevision
    loading.value = true
    error.value = ''
    try {
      const response = await api.get<Address[]>('/addresses')
      if (current !== generation || revision !== listRevision) return
      items.value = response
      loaded.value = true
    } catch (cause) {
      if (current === generation && revision === listRevision) error.value = cause instanceof ApiError ? cause.message : 'دریافت نشانی‌ها ناموفق بود.'
      throw cause
    } finally {
      if (current === generation) loading.value = false
    }
  }, mutating)

  function fetchAll() { requested.value = true; return refresh.request() }
  function revalidate() { return refresh.request(true) }

  async function create(input: AddressWriteInput) {
    if (mutating.value) throw new ApiError('لطفاً تا پایان عملیات نشانی صبر کنید.')
    const current = generation
    mutating.value = true
    try {
      const address = await api.post<Address>('/addresses', input)
      if (current !== generation) throw new ApiError('نشست کاربری تغییر کرده است؛ نشانی‌ها را دوباره دریافت کنید.')
      publish('addresses')
      listRevision++
      items.value.unshift(address)
      return address
    } finally {
      mutating.value = false
    }
  }

  async function update(id: string, input: AddressWriteInput) {
    if (mutating.value) throw new ApiError('لطفاً تا پایان عملیات نشانی صبر کنید.')
    const current = generation
    mutating.value = true
    try {
      const address = await api.put<Address>(`/addresses/${encodeURIComponent(id)}`, input)
      if (current !== generation) throw new ApiError('نشست کاربری تغییر کرده است؛ نشانی‌ها را دوباره دریافت کنید.')
      publish('addresses')
      listRevision++
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) items.value[index] = address
      return address
    } finally {
      mutating.value = false
    }
  }

  async function remove(id: string) {
    if (mutating.value) throw new ApiError('لطفاً تا پایان عملیات نشانی صبر کنید.')
    const current = generation
    mutating.value = true
    try {
      await api.delete(`/addresses/${encodeURIComponent(id)}`)
      if (current !== generation) throw new ApiError('نشست کاربری تغییر کرده است؛ نشانی‌ها را دوباره دریافت کنید.')
      publish('addresses')
      listRevision++
      items.value = items.value.filter(item => item.id !== id)
    } finally {
      mutating.value = false
    }
  }

  return { items, loading, mutating, loaded, requested, error, fetchAll, revalidate, create, update, remove }
})
