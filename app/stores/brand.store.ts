export const useBrandStore = defineStore('brand', () => {
  const items = ref<Brand[]>([])
  const isLoading = ref(false)
  let fetched = false

  let pending: Promise<boolean> | undefined

  function fetchBrands(): Promise<boolean> {
    if (fetched) return Promise.resolve(true)
    if (pending) return pending
    pending = load().finally(() => { pending = undefined })
    return pending
  }

  async function load(): Promise<boolean> {
    isLoading.value = true
    try {
      const res = await useApi().get<BrandsResponse>('/brands')
      items.value = res.items
      fetched = true
      return true
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'خطا در دریافت برندها.')
      return false
    } finally {
      isLoading.value = false
    }
  }

  function findBySlug(slug?: string) {
    return slug ? items.value.find(brand => brand.slug === slug) : undefined
  }

  return { items, isLoading, fetchBrands, findBySlug }
})
