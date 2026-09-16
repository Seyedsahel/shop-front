
export const useProductListStore = defineStore('productList', () => {
  const items = ref<Product[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(30)
  const isLoading = ref(false)
  const isLoadingMore = ref(false)
  const sort = ref('relevant')
  
  const hasMore = computed(() => items.value.length < total.value)
  
  // ---- Main paginated list (used by /products) ----
  async function refetch(mode: 'replace' | 'append' = 'replace') {
    if (mode === 'append') isLoadingMore.value = true
    else isLoading.value = true

    try {
      const filterStore = useFilterStore()
      const sortOption = sortOptions.find(o => o.id === sort.value)

      const res = await useApi().post<ProductListResponse>('/catalog/product-list', {
        ...filterStore.toProductListRequest(),
        page: page.value,
        limit: limit.value,
        sortBy: sortOption?.sortBy,
        sortDir: sortOption?.sortDir,
      } satisfies ProductListRequest)

      items.value = mode === 'append' ? [...items.value, ...res.items] : res.items
      total.value = res.total
      page.value = res.page
      limit.value = res.limit

      const route = useRoute()
      const router = useRouter()
      const categorySlugs = filterStore.selectedCategories.map(category => category.slug)
      const brandSlugs = filterStore.selectedBrands.map(brand => brand.slug)
      router.replace({
        query: {
          ...route.query,
          category: categorySlugs.length ? categorySlugs.join(',') : undefined,
          brand: brandSlugs.length ? brandSlugs.join(',') : undefined,
          sort: sort.value,
          filters: JSON.stringify(filterStore.values),
          priceMin: filterStore.hasCustomPrice ? String(filterStore.selectedPriceMin) : undefined,
          priceMax: filterStore.hasCustomPrice ? String(filterStore.selectedPriceMax) : undefined,
          page: String(page.value),
        },
      })
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'خطا در دریافت محصولات.')
    } finally {
      isLoading.value = false
      isLoadingMore.value = false
    }
  }

  function fetchList(params: { page?: number } = {}) {
    page.value = params.page ?? 1
    refetch('replace')
  }

  function loadMore() {
    if (isLoading.value || isLoadingMore.value || !hasMore.value) return
    page.value += 1
    refetch('append')
  }

  function setSort(id: string) { sort.value = id; page.value = 1; refetch('replace') }
  function setPage(p: number) { page.value = p; refetch('replace') }
  function applyFilters() { page.value = 1; refetch('replace') }

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
    items, total, page, limit, isLoading, isLoadingMore, sort, hasMore,
    fetchList, loadMore, setSort, setPage, applyFilters, refetch,
    previewsByCategory, previewLoading, fetchPreview,
  }
})
