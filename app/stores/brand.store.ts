export const useBrandStore = defineStore('brand', () => {
  const items = ref<Brand[]>([])
  const isLoading = ref(false)

  async function fetchBrands() {
    if (items.value.length) return
    isLoading.value = true
    try {
      const res = await useApi().get<BrandsResponse>('/catalog/brands')
      items.value = res.items
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'خطا در دریافت برندها.')
    } finally {
      isLoading.value = false
    }
  }

  return { items, isLoading, fetchBrands }
})