export const useProductListStore = defineStore('productList', () => {
  const items = ref<Product[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(12)
  const isLoading = ref(false)
  const sort = ref('relevant')

  let currentCategory: string | undefined
  let currentBrand: string | undefined

  async function refetch() {
    isLoading.value = true
    try {
      const filterStore = useFilterStore()
      const query = new URLSearchParams()
      if (currentCategory) query.set('category', currentCategory)
      if (currentBrand) query.set('brand', currentBrand)
      query.set('sort', sort.value)
      query.set('filters', JSON.stringify(filterStore.values))
      query.set('page', String(page.value))

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

  // Called once by the page, whenever category/brand changes
  function fetchList(params: { category?: string; brand?: string }) {
    currentCategory = params.category
    currentBrand = params.brand
    page.value = 1
    refetch()
  }

  function setSort(id: string) {
    sort.value = id
    page.value = 1
    refetch()
  }

  function setPage(p: number) {
    page.value = p
    refetch()
  }

  return { items, total, page, pageSize, isLoading, sort, fetchList, setSort, setPage, refetch }
})