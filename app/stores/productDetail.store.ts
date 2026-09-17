export const useProductDetailStore = defineStore('productDetail', () => {
  const current = ref<ProductDetail | null>(null)
  const isLoading = ref(false)
  const error = ref('')
  let requestId = 0

  async function fetchBySlug(slug: string) {
    const normalizedSlug = slug.trim()
    if (!normalizedSlug) {
      current.value = null
      error.value = 'شناسهٔ محصول نامعتبر است.'
      return
    }

    const activeRequest = ++requestId
    isLoading.value = true
    error.value = ''

    try {
      const product = await useApi().get<ProductDetail>(`/catalog/product-detail/${encodeURIComponent(normalizedSlug)}`)
      if (activeRequest !== requestId) return
      current.value = product
    } catch (caught) {
      if (activeRequest !== requestId) return
      current.value = null
      error.value = caught instanceof ApiError ? caught.message : 'دریافت اطلاعات محصول ناموفق بود.'
    } finally {
      if (activeRequest === requestId) isLoading.value = false
    }
  }

  return { current, isLoading, error, fetchBySlug }
})
