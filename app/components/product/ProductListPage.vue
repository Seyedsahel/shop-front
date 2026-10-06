<script setup lang="ts">
const props = defineProps<{ collection: ProductCollectionContext }>()
const route = useRoute()
const router = useRouter()
const browsePath = route.path
const categoryStore = useCategoryStore()
const brandStore = useBrandStore()
const filterStore = useFilterStore()
const productListStore = useProductListStore()
const isResolving = ref(true)
const browseError = ref('')
let loadId = 0
let isDisposed = false
let hasActiveLoad = false

function invalidateBrowseRequests() {
  loadId++
  hasActiveLoad = false
  productListStore.invalidateListRequests()
  filterStore.invalidateRequests()
}

function matchesConfirmedRoute() {
  const confirmed = router.currentRoute.value
  return confirmed.path === browsePath
    && getProductBrowseQueryKey(confirmed.query) === getProductBrowseQueryKey(route.query)
}

async function loadProductsFromRoute() {
  if (isDisposed || route.path !== browsePath || !matchesConfirmedRoute()) return
  hasActiveLoad = true
  const activeLoad = ++loadId
  // Read the entire route before any await. Later requests use only this snapshot.
  const query = { ...route.query }
  const collection = { ...props.collection }
  productListStore.invalidateListRequests()
  filterStore.invalidateRequests()
  filterStore.resetAll()
  browseError.value = ''
  isResolving.value = true
  try {
    const input = parseProductBrowseQuery(query)
    const ready = await Promise.all([categoryStore.fetchCategories(), brandStore.fetchBrands()])
    if (activeLoad !== loadId) return
    if (ready.some(result => !result)) throw new Error('دریافت دسته‌بندی‌ها و برندها انجام نشد. دوباره تلاش کنید.')
    const categoryIds = resolveProductFacetIds(input.categorySlugs, categoryStore.items)
    resolveProductFacetIds(input.brandSlugs, brandStore.items)
    const context: ProductBrowseContext = {
      collection,
      // Backend category matching is exact. Expand only the request scope;
      // canonical parent slugs remain selected in the URL and filter UI.
      categoryIds: categoryIds.length ? expandProductCategoryIds(categoryIds, categoryStore.items) : undefined,
      discountId: input.discountId,
    }
    const filtersReady = await filterStore.fetchFilters(context)
    if (activeLoad !== loadId) return
    if (!filtersReady) throw new Error('دریافت فیلترها انجام نشد. دوباره تلاش کنید.')
    filterStore.resetAll()
    filterStore.initializeSelections(input)
    const sortOption = sortOptions.find(option => option.id === input.sort) ?? sortOptions[0]!
    await productListStore.fetchList({
      context,
      sort: sortOption.id,
      request: {
        ...filterStore.toProductListRequest(),
        search: input.search || undefined,
        page: input.page,
        limit: productListStore.limit,
        sortBy: sortOption.sortBy,
        sortDir: sortOption.sortDir,
      },
    })
  } catch (error) {
    if (activeLoad === loadId) browseError.value = error instanceof Error ? error.message : 'خطا در دریافت محصولات.'
  } finally {
    if (activeLoad === loadId) isResolving.value = false
  }
}

// User actions own URL changes. Resource responses never navigate.
async function applyFilters(sort = productListStore.sort) {
  if (isResolving.value || route.path !== browsePath || !matchesConfirmedRoute()) return
  const facets = filterStore.toProductListRequest()
  const attributeValues = Object.fromEntries(Object.entries(filterStore.values).filter(([, value]) =>
    value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)
  ))
  const target = {
    path: browsePath,
    query: {
      ...route.query,
      category: filterStore.selectedCategories.map(category => category.slug).join(',') || undefined,
      brand: filterStore.selectedBrands.map(brand => brand.slug).join(',') || undefined,
      sort: sort === 'relevant' ? undefined : sort,
      filters: Object.keys(attributeValues).length ? JSON.stringify(attributeValues) : undefined,
      priceMin: facets.priceMin === undefined ? undefined : String(facets.priceMin),
      priceMax: facets.priceMax === undefined ? undefined : String(facets.priceMax),
      page: undefined,
    },
  }
  if (router.resolve(target).fullPath === route.fullPath) await loadProductsFromRoute()
  else await router.push(target)
}

// Nuxt's route can update after navigation has been confirmed. Invalidate old
// work immediately, then let the route watcher load the committed page snapshot.
const removeNavigationHook = router.afterEach((to, from, failure) => {
  if (failure) return
  if (to.path !== from.path || getProductBrowseQueryKey(to.query) !== getProductBrowseQueryKey(from.query)) {
    invalidateBrowseRequests()
    isResolving.value = true
    // Returning before Nuxt commits another page may leave its route key
    // unchanged. Resume once watchers have had their chance to start a load.
    void nextTick(() => {
      if (!isDisposed && !hasActiveLoad && matchesConfirmedRoute()) void loadProductsFromRoute()
    })
  }
})

onMounted(loadProductsFromRoute)
watch([
  () => route.path,
  () => getProductBrowseQueryKey(route.query),
  () => props.collection.kind,
], loadProductsFromRoute)
onBeforeUnmount(() => {
  isDisposed = true
  removeNavigationHook()
  invalidateBrowseRequests()
})

const pageTitle = computed(() => {
  if (productListStore.listSearch) return `جستجو برای «${productListStore.listSearch}»`
  if (filterStore.selectedCategories.length) return filterStore.selectedCategories.map(category => category.name).join(' / ')
  if (filterStore.selectedBrands.length) return filterStore.selectedBrands.map(brand => brand.name).join(' / ')
  return props.collection.kind === 'discounted' ? 'محصولات تخفیف‌دار' : 'همه محصولات'
})

const sentinel = ref<HTMLElement>()
useInfiniteScroll(sentinel, () => {
  if (!isResolving.value && !browseError.value) productListStore.loadMore()
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex gap-6">
    <FilterSidebar @applied="applyFilters()" />
    <div class="flex-1">
      <h1 class="text-lg font-semibold text-text-primary mb-4">{{ pageTitle }}</h1>
      <p v-if="productListStore.listSearch" class="mb-4 text-sm text-text-secondary">{{ productListStore.total.toLocaleString('fa-IR') }} کالا پیدا شد.</p>
      <div class="flex gap-3 mb-4 lg:hidden"><ProductSortBar @select="applyFilters" /><FilterMobileButton class="flex-1" @applied="applyFilters()" /></div>
      <ProductSortBar class="hidden lg:flex" @select="applyFilters" />
      <div v-if="browseError" role="alert" class="mt-4 rounded-xl border border-danger p-4 text-sm text-danger">
        <p>{{ browseError }}</p>
        <button type="button" class="mt-2 underline" @click="loadProductsFromRoute">تلاش دوباره</button>
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        <template v-if="isResolving || productListStore.isLoading"><div v-for="n in 12" :key="n" class="aspect-square rounded-2xl bg-surface-hover animate-pulse" /></template>
        <ProductCard v-else v-for="product in productListStore.items" :key="product.id" :product="product" />
      </div>
      <p v-if="!browseError && !isResolving && !productListStore.isLoading && !productListStore.items.length" class="py-10 text-center text-sm text-text-muted">محصولی با این فیلترها پیدا نشد.</p>
      <div ref="sentinel" class="h-4" />
      <div v-if="productListStore.isLoadingMore" class="flex justify-center py-6 gap-2 text-sm text-text-muted bg-accent/10 rounded-lg mt-4"><div class="size-6 rounded-full border-2 border-border-strong border-t-primary animate-spin" /><span>در حال بارگذاری...</span></div>
      <p v-if="!productListStore.hasMore && productListStore.items.length" class="text-center text-xs text-text-muted py-6">محصول بیشتری برای نمایش وجود ندارد.</p>
    </div>
  </div>
</template>
