export const useProductListStore = defineStore('productList', () => {
  const items = ref<Product[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(12)
  const isLoading = ref(false)

  async function fetchList(params: ProductListParams) {
    isLoading.value = true
    try {
      const query = new URLSearchParams()
      query.set('category', params.category)
      if (params.sort) query.set('sort', params.sort)
      if (params.filters) query.set('filters', params.filters)
      query.set('page', String(params.page ?? 1))

      const res = await useApi().get<ProductListResponse>(`/catalog/product-list?${query.toString()}`)
      items.value = res.items
      total.value = res.total
      page.value = res.page
      pageSize.value = res.pageSize
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'خطا در دریافت محصولات.')
    } finally {
      isLoading.value = false
    }
  }

  return { items, total, page, pageSize, isLoading, fetchList }
})