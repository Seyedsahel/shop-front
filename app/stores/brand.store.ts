export const useBrandStore = defineStore('brand', () => {
  const api = useApi()

  // Curated home collection is independent of catalog and filter state.
  const homeItems = ref<Brand[]>([])
  const homeLoading = ref(false)
  const homeLoaded = ref(false)
  const homeError = ref('')
  let homePending: Promise<boolean> | undefined

  function fetchHomeBrands(force = false): Promise<boolean> {
    if (homePending) return homePending
    if (!force && homeLoaded.value && !homeError.value) return Promise.resolve(true)
    homePending = loadHomeBrands().finally(() => { homePending = undefined })
    return homePending
  }

  async function loadHomeBrands(): Promise<boolean> {
    homeLoading.value = true
    homeError.value = ''
    try {
      const res = await api.get<BrandsResponse>('/home/brands')
      homeItems.value = res.items
      homeLoaded.value = true
      return true
    } catch (e) {
      homeError.value = e instanceof ApiError ? e.message : 'خطا در دریافت برندها.'
      return false
    } finally {
      homeLoading.value = false
    }
  }

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

  return {
    homeItems, homeLoading, homeLoaded, homeError, fetchHomeBrands,
    items, isLoading, loaded, error, fetchBrands, findBySlug,
  }
})
