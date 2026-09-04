export const useProductListStore = defineStore('productList', () => {
  // ---- Main paginated list (used by /products) ----
  const items = ref<Product[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(12)
  const isLoading = ref(false)
  const sort = ref('relevant')
  let currentCategoryIds: string[] | undefined
  let priceMin: number | undefined
  let priceMax: number | undefined

  async function refetch() {
    isLoading.value = true
    try {
      const filterStore = useFilterStore()
      const sortOption = sortOptions.find(o => o.id === sort.value)

      const res = await useApi().post<ProductListResponse>('/catalog/product-list', {
        categoryIds: currentCategoryIds,
        priceMin,
        priceMax,
        attributeFields: filterStore.toAttributeFields(),
        page: page.value,
        limit: limit.value,
        sortBy: sortOption?.sortBy,
        sortDir: sortOption?.sortDir,
      } satisfies ProductListRequest)

      items.value = res.items
      total.value = res.total
      page.value = res.page
      limit.value = res.limit

      const route =useRoute()
      const router = useRouter()
      router.replace({
        query: {
          ...route.query, // keeps `category` (the slug) untouched
          sort: sort.value,
          filters: JSON.stringify(filterStore.values),
          page: String(page.value),
        },
      })
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'خطا در دریافت محصولات.')
    } finally {
      isLoading.value = false
    }
  }

  function fetchList(params: { categoryIds?: string[]; page?: number }) {
    currentCategoryIds = params.categoryIds
    page.value = params.page ?? 1
    refetch()
  }

  function setSort(id: string) { sort.value = id; page.value = 1; refetch() }
  function setPage(p: number) { page.value = p; refetch() }
  function setPriceRange(min?: number, max?: number) { priceMin = min; priceMax = max; page.value = 1; refetch() }

  // ---- Home-preview cache (used by ProductGrid/ProductSlider, keyed independently) ----
  const previewsByCategory = ref<Record<string, Product[]>>({})
  const previewLoading = ref<Record<string, boolean>>({})

  async function fetchPreview(categoryId: string) {
    previewLoading.value[categoryId] = true
    try {
      const res = await useApi().post<ProductListResponse>('/catalog/product-list', {
        categoryIds: [categoryId],
        page: 1,
        limit: 12,
      } satisfies ProductListRequest)
      previewsByCategory.value[categoryId] = res.items
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'خطا در دریافت محصولات.')
    } finally {
      previewLoading.value[categoryId] = false
    }
  }

  return {
    items, total, page, limit, isLoading, sort,
    fetchList, setSort, setPage, setPriceRange, refetch,
    previewsByCategory, previewLoading, fetchPreview,
  }
})