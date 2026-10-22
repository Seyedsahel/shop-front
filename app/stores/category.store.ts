export const useCategoryStore = defineStore('category', () => {
  const api = useApi()

  // Curated home collection is independent of catalog and filter state.
  const homeItems = ref<ProductCategory[]>([])
  const homeLoading = ref(false)
  const homeLoaded = ref(false)
  const homeError = ref('')
  let homePending: Promise<boolean> | undefined

  function fetchHomeCategories(force = false): Promise<boolean> {
    if (homePending) return homePending
    if (!force && homeLoaded.value && !homeError.value) return Promise.resolve(true)
    homePending = loadHomeCategories().finally(() => { homePending = undefined })
    return homePending
  }

  async function loadHomeCategories(): Promise<boolean> {
    homeLoading.value = true
    homeError.value = ''
    try {
      const res = await api.get<CategoriesResponse>('/home/categories')
      homeItems.value = res.items
      homeLoaded.value = true
      return true
    } catch (e) {
      homeError.value = e instanceof ApiError ? e.message : 'خطا در دریافت دسته‌بندی‌ها.'
      return false
    } finally {
      homeLoading.value = false
    }
  }

  const items = ref<ProductCategory[]>([])
  const isLoading = ref(false)
  const loaded = ref(false)
  const error = ref('')

  let pending: Promise<boolean> | undefined

  function fetchCategories(): Promise<boolean> {
      if (loaded.value) return Promise.resolve(true)
      if (pending) return pending
      pending = load().finally(() => { pending = undefined })
      return pending
  }

  async function load(): Promise<boolean> {
      isLoading.value = true
      error.value = ''
      try {
          const res = await api.get<CategoriesResponse>('/categories')
          items.value = res.items
          loaded.value = true
          return true
      } catch (e){
          error.value = e instanceof ApiError ? e.message : 'خطا در دریافت دسته بندی ها'
          return false
      } finally {
          isLoading.value = false
      }
  }

  return {
    homeItems, homeLoading, homeLoaded, homeError, fetchHomeCategories,
    items, isLoading, loaded, error, fetchCategories,
  }
})
