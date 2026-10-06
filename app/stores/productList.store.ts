
export const useProductListStore = defineStore('productList', () => {
  const items = ref<Product[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(30)
  const isLoading = ref(false)
  const isLoadingMore = ref(false)
  const sort = ref('relevant')
  const listSearch = ref('')
  const browseRequest = ref<{ context: ProductBrowseContext; request: ProductListRequest } | null>(null)
  const hasDiscountedProducts = ref<boolean | null>(null)
  const isDiscountedAvailabilityLoading = ref(false)
  let listRequestId = 0
  let searchRequestId = 0
  
  const lastPageSize = ref(0)
  // A URL may start at page > 1. Accumulated item count is not its offset.
  const hasMore = computed(() => lastPageSize.value > 0 && page.value * limit.value < total.value)

  // ---- Live product search (used by navbar and mobile overlay) ----
  const searchItems = ref<Product[]>([])
  const searchTotal = ref(0)
  const searchPage = ref(1)
  const searchLimit = ref(12)
  const searchQuery = ref('')
  const isSearchLoading = ref(false)
  const searchError = ref('')
  
  // ---- Main paginated list (used by /products) ----
  async function refetch(mode: 'replace' | 'append' = 'replace', requestedPage = page.value) {
    if (!browseRequest.value) return
    const { context, request } = browseRequest.value
    const requestId = ++listRequestId
    if (mode === 'append') isLoadingMore.value = true
    else isLoading.value = true

    try {
      const res = await useApi().post<ProductListResponse>(context.collection.kind === 'discounted' ? '/discounts/products' : '/products/list', {
        ...request,
        categoryIds: context.categoryIds,
        discountId: context.discountId,
        page: requestedPage,
      } satisfies ProductListRequest)

      if (requestId !== listRequestId) return

      if (mode === 'append') {
        const existingIds = new Set(items.value.map(item => item.id))
        items.value = [...items.value, ...res.items.filter(item => !existingIds.has(item.id))]
      } else {
        items.value = res.items
      }
      lastPageSize.value = res.items.length
      total.value = res.total
      page.value = res.page
      limit.value = res.limit
    } catch (e) {
      if (requestId !== listRequestId) return
      useAppToast().error(e instanceof ApiError ? e.message : 'خطا در دریافت محصولات.')
    } finally {
      if (requestId === listRequestId) {
        isLoading.value = false
        isLoadingMore.value = false
      }
    }
  }

  function invalidateListRequests() {
    listRequestId++
    isLoading.value = false
    isLoadingMore.value = false
    browseRequest.value = null
    items.value = []
    total.value = 0
    lastPageSize.value = 0
    listSearch.value = ''
  }

  function fetchList(params: { context: ProductBrowseContext; request: ProductListRequest; sort: string }) {
    // Store an immutable applied snapshot. Load-more must not use unapplied UI drafts.
    browseRequest.value = {
      context: {
        collection: { ...params.context.collection },
        categoryIds: params.context.categoryIds ? [...params.context.categoryIds] : undefined,
        discountId: params.context.discountId,
      },
      request: {
        ...params.request,
        brandIds: params.request.brandIds ? [...params.request.brandIds] : undefined,
        attributeFields: Object.fromEntries(Object.entries(params.request.attributeFields ?? {}).map(([slug, values]) => [slug, [...values]])),
      },
    }
    sort.value = params.sort
    listSearch.value = params.request.search ?? ''
    page.value = params.request.page ?? 1
    return refetch('replace', page.value)
  }

  function loadMore() {
    if (isLoading.value || isLoadingMore.value || !hasMore.value) return
    return refetch('append', page.value + 1)
  }

  async function fetchDiscountedAvailability() {
    if (hasDiscountedProducts.value !== null || isDiscountedAvailabilityLoading.value) return
    isDiscountedAvailabilityLoading.value = true
    try {
      const res = await useApi().post<ProductListResponse>('/discounts/products', {
        page: 1,
        limit: 1,
      } satisfies ProductListRequest)
      hasDiscountedProducts.value = res.total > 0
    } catch (e) {
      hasDiscountedProducts.value = false
      useAppToast().error(e instanceof ApiError ? e.message : 'خطا در دریافت محصولات تخفیف‌دار.')
    } finally {
      isDiscountedAvailabilityLoading.value = false
    }
  }

  async function searchProducts(params: {
    search: string
    page?: number
    limit?: number
    sortBy?: string
    sortDir?: 'asc' | 'desc'
  }) {
    const normalizedSearch = params.search.trim()
    const requestId = ++searchRequestId
    searchQuery.value = normalizedSearch
    searchError.value = ''

    if (!normalizedSearch) {
      searchItems.value = []
      searchTotal.value = 0
      searchPage.value = 1
      isSearchLoading.value = false
      return
    }

    isSearchLoading.value = true

    try {
      const res = await useApi().post<ProductListResponse>('/products/list', {
        search: normalizedSearch,
        page: params.page ?? 1,
        limit: params.limit ?? searchLimit.value,
        sortBy: params.sortBy,
        sortDir: params.sortDir,
      } satisfies ProductListRequest)

      if (requestId !== searchRequestId) return

      searchItems.value = res.items
      searchTotal.value = res.total
      searchPage.value = res.page
      searchLimit.value = res.limit
    } catch (e) {
      if (requestId !== searchRequestId) return
      searchItems.value = []
      searchTotal.value = 0
      searchError.value = e instanceof ApiError ? e.message : 'خطا در جستجوی محصولات.'
    } finally {
      if (requestId === searchRequestId) isSearchLoading.value = false
    }
  }

  function clearSearch() {
    searchRequestId++
    searchItems.value = []
    searchTotal.value = 0
    searchPage.value = 1
    searchQuery.value = ''
    searchError.value = ''
    isSearchLoading.value = false
  }

  // ---- Home-preview cache (used by ProductGrid/ProductSlider, keyed independently) ----
  const previewsByCategory = ref<Record<string, Product[]>>({})
  const previewLoading = ref<Record<string, boolean>>({})

  async function fetchPreview(categoryId: string) {
    previewLoading.value[categoryId] = true
    try {
      const res = await useApi().post<ProductListResponse>('/products/list', {
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
    items, total, page, limit, isLoading, isLoadingMore, sort, listSearch, browseRequest, lastPageSize, hasMore,
    hasDiscountedProducts, isDiscountedAvailabilityLoading, fetchDiscountedAvailability,
    fetchList, loadMore, invalidateListRequests,
    searchItems, searchTotal, searchPage, searchLimit, searchQuery, isSearchLoading, searchError,
    searchProducts, clearSearch,
    previewsByCategory, previewLoading, fetchPreview,
  }
})
