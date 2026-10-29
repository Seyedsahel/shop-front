<script setup lang="ts">
const props = defineProps<{ collection: ProductCollectionContext }>()
const route = useRoute()
const router = useRouter()
const browsePath = route.path
const categoryStore = useCategoryStore()
const brandStore = useBrandStore()
const filterStore = useFilterStore()
const productListStore = useProductListStore()
const listOwner = productListStore.claimListOwner()
const filterOwner = filterStore.claimFilterOwner()
const setStatus = usePageResponse()
const isResolving = ref(true)
const productScroll = ref<HTMLElement>()
const browseError = useState<string>(`browse:error:${browsePath}:${getProductBrowseQueryKey(route.query)}`, () => '')
const filtersAvailable = computed(() => filterStore.scopedMetadataAvailable && !filterStore.error && !categoryStore.error && !brandStore.error)
const hasBrowseConstraints = computed(() => ['category', 'brand', 'search', 'priceMin', 'priceMax', 'filters', 'discount', 'page']
  .some(key => route.query[key] != null && route.query[key] !== ''))
let loadId = 0
let isDisposed = false
let hasActiveLoad = false

function invalidateBrowseRequests() {
  loadId++
  hasActiveLoad = false
  productListStore.invalidateListRequests(listOwner)
  filterStore.invalidateRequests(filterOwner)
}

function matchesConfirmedRoute() {
  const confirmed = router.currentRoute.value
  return confirmed.path === browsePath
    && getProductBrowseQueryKey(confirmed.query) === getProductBrowseQueryKey(route.query)
}

async function loadProductsFromRoute() {
  if (isDisposed || !productListStore.ownsList(listOwner) || route.path !== browsePath || !matchesConfirmedRoute()) return
  if (productScroll.value) productScroll.value.scrollTop = 0
  hasActiveLoad = true
  const activeLoad = ++loadId
  // Read the entire route before any await. Later requests use only this snapshot.
  const query = { ...route.query }
  const collection = { ...props.collection }
  productListStore.invalidateListRequests(listOwner)
  filterStore.invalidateRequests(filterOwner)
  filterStore.resetAll()
  browseError.value = ''
  isResolving.value = true
  let inputInvalid = true
  try {
    const input = parseProductBrowseQuery(query)
    inputInvalid = false
    const ready = await Promise.allSettled([categoryStore.fetchCategories(), brandStore.fetchBrands()])
    if (activeLoad !== loadId || !productListStore.ownsList(listOwner)) return
    // Canonical metadata is essential only for facets selected in the URL.
    if (input.categorySlugs.length && (ready[0].status === 'rejected' || !ready[0].value)) {
      throw new ApiError('دریافت دسته‌بندی انتخاب‌شده انجام نشد. دوباره تلاش کنید.')
    }
    if (input.brandSlugs.length && (ready[1].status === 'rejected' || !ready[1].value)) {
      throw new ApiError('دریافت برند انتخاب‌شده انجام نشد. دوباره تلاش کنید.')
    }
    inputInvalid = true
    const categoryIds = resolveProductFacetIds(input.categorySlugs, categoryStore.items)
    const brandIds = resolveProductFacetIds(input.brandSlugs, brandStore.items)
    inputInvalid = false
    const context: ProductBrowseContext = {
      collection,
      // Backend category matching is exact. Expand only the request scope;
      // canonical parent slugs remain selected in the URL and filter UI.
      categoryIds: categoryIds.length ? expandProductCategoryIds(categoryIds, categoryStore.items) : undefined,
      discountId: input.discountId,
    }
    const filtersReady = await filterStore.fetchFilters(context, filterOwner).catch(() => false)
    if (activeLoad !== loadId || !productListStore.ownsList(listOwner)) return
    filterStore.resetAll()
    filterStore.initializeSelections(input)
    const sortOption = sortOptions.find(option => option.id === input.sort) ?? sortOptions[0]!
    await productListStore.fetchList({
      context,
      sort: sortOption.id,
      request: {
        ...filterStore.toProductListRequest(),
        brandIds: brandIds.length ? brandIds : undefined,
        // Metadata failure must not silently discard applied URL constraints.
        ...(!filtersReady ? {
          priceMin: input.priceMin,
          priceMax: input.priceMax,
          attributeFields: Object.fromEntries(Object.entries(input.attributeValues).flatMap(([slug, value]) => {
            const values = Array.isArray(value) ? value : typeof value === 'string' && value ? [value] : []
            return values.length ? [[slug, values]] : []
          })),
        } : {}),
        search: input.search || undefined,
        page: input.page,
        limit: productListStore.limit,
        sortBy: sortOption.sortBy,
        sortDir: sortOption.sortDir,
      },
    }, listOwner)
    if (activeLoad === loadId && productListStore.error) setStatus(productListStore.errorStatus ?? 503)
  } catch (error) {
    if (activeLoad === loadId) {
      browseError.value = error instanceof Error ? error.message : 'خطا در دریافت محصولات.'
      setStatus(inputInvalid ? 400 : error instanceof ApiError ? error.status ?? 503 : 503)
    }
  } finally {
    if (activeLoad === loadId) isResolving.value = false
  }
}

// User actions own URL changes. Resource responses never navigate.
async function applyFilters(sort = productListStore.sort) {
  if (isResolving.value || route.path !== browsePath || !matchesConfirmedRoute()) return
  if (!filtersAvailable.value) {
    // Sorting is independent of optional filter controls; retain the applied URL.
    await router.push({ path: browsePath, query: { ...route.query, sort: sort === 'relevant' ? undefined : sort, page: undefined } })
    return
  }
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

// Nuxt keeps this page visible while the destination's async setup resolves.
// Cancel outgoing work without replacing the visible list with its loader.
const removeNavigationHook = router.afterEach((to, from, failure) => {
  if (failure) return
  if (to.path !== from.path || getProductBrowseQueryKey(to.query) !== getProductBrowseQueryKey(from.query)) {
    if (to.path !== browsePath) {
      loadId++
      hasActiveLoad = false
      productListStore.cancelListRequests(listOwner)
      filterStore.cancelRequests(filterOwner)
      isResolving.value = false
      return
    }
    invalidateBrowseRequests()
    isResolving.value = true
    // Returning before Nuxt commits another page may leave its route key
    // unchanged. Resume once watchers have had their chance to start a load.
    void nextTick(() => {
      if (!isDisposed && !hasActiveLoad && matchesConfirmedRoute()) void loadProductsFromRoute()
    })
  }
})

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

const paginationSummary = computed(() => {
  if (!productListStore.loaded || isResolving.value || browseError.value || productListStore.limit <= 0) return ''
  const pageCount = Math.max(1, Math.ceil(productListStore.total / productListStore.limit))
  return `صفحه ${productListStore.page.toLocaleString('fa-IR')} از ${pageCount.toLocaleString('fa-IR')} (${productListStore.total.toLocaleString('fa-IR')} محصول)`
})

const sentinel = ref<HTMLElement>()
function retryProducts() {
  if (!isDisposed && !isResolving.value && matchesConfirmedRoute()) void productListStore.retryList()
}
useInfiniteScroll(sentinel, () => {
  if (!isDisposed && matchesConfirmedRoute() && !isResolving.value && !browseError.value) productListStore.loadMore()
}, { root: productScroll, rootMargin: '0px 0px 200px 0px' })
usePageSeo(pageTitle, 'مشاهده محصولات فروشگاه و فیلتر دسته‌بندی‌ها و برندها.')
const initialLoad = () => callOnce(`browse:${browsePath}:${getProductBrowseQueryKey(route.query)}`, loadProductsFromRoute, { mode: 'navigation' })
// Hydrate the server's store snapshot before reconciling a different browser URL.
// Reloading during hydration removes filter fragments while Vue still adopts them,
// leaving an orphaned sidebar when a proxy has stripped the SSR query string.
if (import.meta.server) await initialLoad()
else if (useNuxtApp().isHydrating) onNuxtReady(initialLoad)
// Client navigation still renders its loading state immediately.
else void initialLoad()
// callOnce skips only the SSR hydration fetch; controller-local state is not serialized.
if (!hasActiveLoad && (browseError.value || productListStore.loaded || productListStore.error || filterStore.error)) isResolving.value = false
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 gap-x-6 lg:gap-y-8" :class="{ 'lg:grid-cols-[18rem_minmax(0,1fr)]': filtersAvailable }">
    <div class="min-w-0" :class="{ 'lg:col-start-2': filtersAvailable }">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h1 class="text-lg font-semibold text-text-primary">{{ pageTitle }}</h1>
        <p v-if="paginationSummary" class="text-sm text-text-secondary" dir="rtl">{{ paginationSummary }}</p>
      </div>
      <p v-if="productListStore.listSearch && productListStore.loaded" class="mb-4 text-sm text-text-secondary">{{ productListStore.total.toLocaleString('fa-IR') }} کالا پیدا شد.</p>
      <div class="flex gap-3 mb-4 lg:hidden"><ProductSortBar @select="applyFilters" /><UiOptionalSection :failed="!filtersAvailable"><FilterMobileButton class="flex-1" @applied="applyFilters()" /></UiOptionalSection></div>
      <ProductSortBar class="hidden lg:flex" @select="applyFilters" />
    </div>
    <UiOptionalSection :failed="!filtersAvailable"><FilterSidebar class="lg:row-start-2" @applied="applyFilters()" /></UiOptionalSection>
    <section ref="productScroll" class="product-scroll min-w-0 mt-4 lg:mt-0 overflow-auto rounded-xl" :class="{ 'lg:col-start-2': filtersAvailable }" tabindex="0" role="region" aria-label="فهرست محصولات">
      <div v-if="isResolving || productListStore.isLoading" role="status" aria-live="polite" class="flex min-h-64 items-center justify-center gap-2 text-sm text-text-muted">
        <span class="size-6 rounded-full border-2 border-border-strong border-t-primary animate-spin" aria-hidden="true" />
        <span>در حال بارگذاری...</span>
      </div>
      <div v-else-if="browseError" role="alert" class="mt-4 rounded-xl border border-danger p-4 text-sm text-danger">
        <p>{{ browseError }}</p>
        <button type="button" class="mt-2 underline" @click="loadProductsFromRoute">تلاش دوباره</button>
      </div>
      <div v-else-if="productListStore.items.length" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 lg:mt-0">
        <ProductCard v-for="product in productListStore.items" :key="product.id" :product="product" />
      </div>
      <ProductEmptyState
        v-else-if="!productListStore.error && productListStore.loaded"
        :filtered="hasBrowseConstraints"
        :reset-to="browsePath"
      />
      <div v-if="!browseError && productListStore.error" role="alert" class="mt-4 rounded-xl border border-danger p-4 text-sm text-danger">
        <p>{{ productListStore.error }}</p>
        <button type="button" :disabled="isResolving || productListStore.isLoading || productListStore.isLoadingMore" class="mt-2 underline disabled:opacity-50" @click="retryProducts">تلاش دوباره</button>
      </div>
      <div ref="sentinel" class="h-4" />
      <div v-if="productListStore.isLoadingMore" class="flex justify-center py-6 gap-2 text-sm text-text-muted bg-accent/10 rounded-lg mt-4"><div class="size-6 rounded-full border-2 border-border-strong border-t-primary animate-spin" /><span>در حال بارگذاری...</span></div>
      <p v-if="!productListStore.error && !productListStore.hasMore && productListStore.items.length" class="text-center text-xs text-text-muted py-6">محصول بیشتری برای نمایش وجود ندارد.</p>
    </section>
  </div>
</template>

<style scoped>
.product-scroll {
  max-height: 70vh;
  max-height: 70dvh;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}
</style>
