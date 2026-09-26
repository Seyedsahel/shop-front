export const useBrandStore = defineStore('brand', () => {
  const items = ref<Brand[]>([])
  const isLoading = ref(false)
  let fetched = false

  async function fetchBrands() {
    if (fetched) return
    isLoading.value = true
    try {
      const res = await useApi().get<BrandsResponse>('/brands')
      items.value = res.items
      fetched = true
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'خطا در دریافت برندها.')
    } finally {
      isLoading.value = false
    }
  }

  function findBySlug(slug?: string) {
    return slug ? items.value.find(brand => brand.slug === slug) : undefined
  }

  return { items, isLoading, fetchBrands, findBySlug }
})
