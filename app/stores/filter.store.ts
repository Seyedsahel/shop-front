export const useFilterStore = defineStore('filter', () => {
  const definitions = ref<FilterDefinition[]>([])
  // Filter-option responses are incomplete; canonical collections resolve every facet.
  const categoryStore = useCategoryStore()
  const brandStore = useBrandStore()
  const brands = computed(() => brandStore.items)
  const categories = computed(() => categoryStore.items)
  const priceRange = reactive<FilterPriceRange>({ min: 0, max: 0 })
  const values = reactive<Record<string, FilterValue>>({})
  const selectedBrandIds = ref<string[]>([])
  const selectedCategoryIds = ref<string[]>([])
  const selectedPriceMin = ref<number | null>(null)
  const selectedPriceMax = ref<number | null>(null)
  const isLoading = ref(false)
  const error = ref('')
  const scopedMetadataAvailable = ref(false)
  let requestId = 0
  let controller: AbortController | undefined

  function invalidateRequests() {
    requestId++
    controller?.abort()
    controller = undefined
    error.value = ''
    isLoading.value = false
    scopedMetadataAvailable.value = false
    definitions.value = []
  }

  async function fetchFilters(context: ProductBrowseContext): Promise<boolean> {
    const activeRequest = ++requestId
    controller?.abort()
    const activeController = new AbortController()
    controller = activeController
    error.value = ''
    scopedMetadataAvailable.value = false
    definitions.value = []
    priceRange.min = 0
    priceRange.max = 0
    isLoading.value = true
    try {
      const res = await useApi().post<FiltersResponse>('/products/filters', {
        collection: { ...context.collection },
        categoryIds: context.categoryIds ? [...context.categoryIds] : undefined,
        discountId: context.discountId,
        limit: 20,
      } satisfies ProductFiltersRequest, { signal: activeController.signal })
      if (activeRequest !== requestId) return false
      definitions.value = res.attributes
      priceRange.min = res.priceRange.min
      priceRange.max = res.priceRange.max
      scopedMetadataAvailable.value = true
      return true
    } catch (e) {
      if (activeRequest === requestId && !(e instanceof ApiError && e.kind === 'cancelled')) error.value = e instanceof ApiError ? e.message : 'خطا در دریافت فیلترها.'
      return false
    } finally {
      if (activeRequest === requestId) { isLoading.value = false; controller = undefined }
    }
  }

  function setValue(slug: string, value: FilterValue) {
    values[slug] = value
  }

  function toggleBrand(id: string) {
    selectedBrandIds.value = selectedBrandIds.value.includes(id)
      ? selectedBrandIds.value.filter(brandId => brandId !== id)
      : [...selectedBrandIds.value, id]
  }

  function toggleCategory(id: string) {
    selectedCategoryIds.value = selectedCategoryIds.value.includes(id)
      ? selectedCategoryIds.value.filter(categoryId => categoryId !== id)
      : [...selectedCategoryIds.value, id]
  }

  function setPriceRange(min?: number | null, max?: number | null) {
    selectedPriceMin.value = min ?? null
    selectedPriceMax.value = max ?? null
  }

  function resetAll() {
    const liveSlugs = new Set(definitions.value.map(filter => filter.slug))
    for (const slug of Object.keys(values)) {
      if (!liveSlugs.has(slug)) delete values[slug]
    }
    for (const filter of definitions.value) {
      values[filter.slug] = filter.dataType === 'multiselect' ? [] : null
    }
    selectedBrandIds.value = []
    selectedCategoryIds.value = []
    selectedPriceMin.value = scopedMetadataAvailable.value ? priceRange.min : null
    selectedPriceMax.value = scopedMetadataAvailable.value ? priceRange.max : null
  }

  function initializeSelections(input: { categorySlugs?: string[]; brandSlugs?: string[]; attributeValues?: Record<string, FilterValue>; priceMin?: number; priceMax?: number }) {
    selectedCategoryIds.value = (input.categorySlugs ?? [])
      .map(slug => categories.value.find(category => category.slug === slug || category.id === slug)?.id)
      .filter(Boolean) as string[]
    selectedBrandIds.value = (input.brandSlugs ?? [])
      .map(slug => brands.value.find(brand => brand.slug === slug || brand.id === slug)?.id)
      .filter(Boolean) as string[]
    for (const filter of definitions.value) {
      const value = input.attributeValues?.[filter.slug]
      if (value === null || typeof value === 'string' || (Array.isArray(value) && value.every(item => typeof item === 'string'))) {
        values[filter.slug] = Array.isArray(value) ? [...value] : value
      }
    }
    if (input.priceMin !== undefined) selectedPriceMin.value = input.priceMin
    if (input.priceMax !== undefined) selectedPriceMax.value = input.priceMax
  }

  const selectedBrands = computed(() => brands.value.filter(brand => selectedBrandIds.value.includes(brand.id)))
  const selectedCategories = computed(() => categories.value.filter(category => selectedCategoryIds.value.includes(category.id)))

  const hasCustomPrice = computed(() =>
    (selectedPriceMin.value !== null && (!scopedMetadataAvailable.value || selectedPriceMin.value !== priceRange.min))
    || (selectedPriceMax.value !== null && (!scopedMetadataAvailable.value || selectedPriceMax.value !== priceRange.max))
  )

  const activeCount = computed(() => {
    const attributeCount = definitions.value.filter(filter => {
      const value = values[filter.slug]
      return value !== null && value !== undefined && !(Array.isArray(value) && value.length === 0)
    }).length
    return attributeCount + selectedBrandIds.value.length + selectedCategoryIds.value.length + (hasCustomPrice.value ? 1 : 0)
  })

  // Converts current values into the backend's attribute_fields shape —
  // every dynamic attribute (select/string/multiselect/boolean) becomes a string[]
  // keyed by slug, since that's the one shape the backend accepts for all of them.
  function toAttributeFields(): Record<string, string[]> {
    const fields: Record<string, string[]> = {}
    for (const filter of definitions.value) {
      const slug = filter.slug
      const value = values[slug]
      if (value === null || value === undefined) continue
      if (Array.isArray(value) && value.length) fields[slug] = value
      else if (typeof value === 'string' && value) fields[slug] = [value]
    }
    return fields
  }

  function toProductListRequest(): Pick<ProductListRequest, 'categoryIds' | 'brandIds' | 'priceMin' | 'priceMax' | 'attributeFields'> {
    return {
      categoryIds: selectedCategoryIds.value.length ? selectedCategoryIds.value : undefined,
      brandIds: selectedBrandIds.value.length ? selectedBrandIds.value : undefined,
      priceMin: selectedPriceMin.value === null || (scopedMetadataAvailable.value && selectedPriceMin.value === priceRange.min) ? undefined : selectedPriceMin.value,
      priceMax: selectedPriceMax.value === null || (scopedMetadataAvailable.value && selectedPriceMax.value === priceRange.max) ? undefined : selectedPriceMax.value,
      attributeFields: toAttributeFields(),
    }
  }

  return {
    definitions,
    brands,
    categories,
    priceRange,
    values,
    selectedBrandIds,
    selectedCategoryIds,
    selectedPriceMin,
    selectedPriceMax,
    selectedBrands,
    selectedCategories,
    isLoading,
    error,
    scopedMetadataAvailable,
    activeCount,
    hasCustomPrice,
    fetchFilters,
    invalidateRequests,
    setValue,
    toggleBrand,
    toggleCategory,
    setPriceRange,
    resetAll,
    initializeSelections,
    toAttributeFields,
    toProductListRequest,
  }
})
