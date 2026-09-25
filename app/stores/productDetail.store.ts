export const useProductDetailStore = defineStore('productDetail', () => {
  const current = ref<ProductDetail | null>(null)
  const isLoading = ref(false)
  const error = ref('')
  let requestId = 0
  const bySlug = ref<Record<string, ProductDetail>>({})
  const pending = new Map<string, Promise<ProductDetail>>()

  function loadBySlug(slug: string): Promise<ProductDetail> {
    const key = slug.trim()
    if (!key) return Promise.reject(new ApiError('شناسهٔ محصول نامعتبر است.'))
    const existing = pending.get(key)
    if (existing) return existing
    const api = useApi()
    const request = api.get<ProductDetail>(`/catalog/product-detail/${encodeURIComponent(key)}`)
      .then(product => { bySlug.value[key] = product; return product })
      .catch(cause => { throw withApiErrorContext(cause, 'productDetail') })
      .finally(() => { pending.delete(key) })
    pending.set(key, request)
    return request
  }

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
      const product = await loadBySlug(normalizedSlug)
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

  return { bySlug, loadBySlug, current, isLoading, error, fetchBySlug }
})
