export const useShippingLocationsStore = defineStore('shippingLocations', () => {
  const api = useApi()
  const provinces = ref<ShippingProvince[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref('')
  let pending: Promise<void> | null = null

  function fetchAll(): Promise<void> {
    if (pending) return pending
    if (loaded.value) return Promise.resolve()
    pending = load().finally(() => { pending = null })
    return pending
  }

  async function load() {
    loading.value = true
    error.value = ''
    try {
      provinces.value = await api.get<ShippingProvince[]>('/shipping/locations')
      loaded.value = true
    } catch (cause) {
      error.value = cause instanceof ApiError ? cause.message : 'دریافت استان‌ها و شهرها ناموفق بود.'
      throw cause
    } finally {
      loading.value = false
    }
  }

  return { provinces, loading, loaded, error, fetchAll }
})
