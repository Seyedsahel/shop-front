export const useShippingLocationsStore = defineStore('shippingLocations', () => {
  const api = useApi()
  const provinces = ref<ShippingProvince[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref('')

  async function fetchAll() {
    if (loaded.value || loading.value) return
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
