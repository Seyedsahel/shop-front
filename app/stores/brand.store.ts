export const useBrandStore = defineStore('brand', () => {
  const api = useApi()
  const items = ref<Brand[]>([])
  const isLoading = ref(false)
  const loaded = ref(false)
  const error = ref('')

  let pending: Promise<boolean> | undefined

  function fetchBrands(): Promise<boolean> {
    if (loaded.value) return Promise.resolve(true)
    if (pending) return pending
    pending = load().finally(() => { pending = undefined })
    return pending
  }

  async function load(): Promise<boolean> {
    isLoading.value = true
    error.value = ''
    try {
      const res = await api.get<BrandsResponse>('/brands')
      items.value = res.items
      loaded.value = true
      return true
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'خطا در دریافت برندها.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  function findBySlug(slug?: string) {
    return slug ? items.value.find(brand => brand.slug === slug) : undefined
  }

  return { items, isLoading, loaded, error, fetchBrands, findBySlug }
})
