export const useProductDetailStore = defineStore('productDetail', () => {
  const api = useApi()
  const current = ref<ProductDetail | null>(null)
  const isLoading = ref(false)
  const error = ref('')
  const errorStatus = ref<number | undefined>()
  let requestId = 0
  let detailOwner: symbol | undefined
  function claimDetailOwner() { detailOwner = Symbol('detail'); requestId++; return detailOwner }
  const bySlug = ref<Record<string, ProductDetail>>({})
  const pending = new Map<string, Promise<ProductDetail>>()

  function loadBySlug(slug: string): Promise<ProductDetail> {
    const key = slug.trim()
    if (!key) return Promise.reject(new ApiError('شناسهٔ محصول نامعتبر است.'))
    const existing = pending.get(key)
    if (existing) return existing
    const request = api.get<ProductDetail>(`/products/${encodeURIComponent(key)}/detail`)
      .then(product => { bySlug.value[key] = product; return product })
      .catch(cause => { throw withApiErrorContext(cause, 'productDetail') })
      .finally(() => { pending.delete(key) })
    pending.set(key, request)
    return request
  }

  async function fetchBySlug(slug: string, owner?: symbol) {
    if (owner && owner !== detailOwner) return
    const normalizedSlug = slug.trim()
    if (!normalizedSlug) {
      current.value = null
      error.value = 'شناسهٔ محصول نامعتبر است.'
      return
    }

    const activeRequest = ++requestId
    current.value = null
    isLoading.value = true
    errorStatus.value = undefined
    error.value = ''

    try {
      const product = await loadBySlug(normalizedSlug)
      if (activeRequest !== requestId) return
      current.value = product
      return product
    } catch (caught) {
      if (activeRequest !== requestId) return
      current.value = null
      errorStatus.value = caught instanceof ApiError ? caught.status : undefined
      error.value = caught instanceof ApiError ? caught.message : 'دریافت اطلاعات محصول ناموفق بود.'
    } finally {
      if (activeRequest === requestId) isLoading.value = false
    }
  }

  function invalidateDetail(owner?: symbol) { if (owner && owner !== detailOwner) return; requestId++; current.value = null; isLoading.value = false }

  return { errorStatus, invalidateDetail, claimDetailOwner, bySlug, loadBySlug, current, isLoading, error, fetchBySlug }
})
