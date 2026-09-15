<script setup lang="ts">
const route = useRoute()
const filterStore = useFilterStore()
const productListStore = useProductListStore()
const categoryStore = useCategoryStore()
const brandStore = useBrandStore()

async function loadProducts(categorySlug?: string, brandSlug?: string) {
  const category = categorySlug ? categoryStore.items.find(c => c.slug === categorySlug) : undefined
  const brand = brandStore.findBySlug(brandSlug)
  const categoryIds = category ? [category.id] : undefined
  const brandIds = brand ? [brand.id] : undefined
  await filterStore.fetchFilters(categoryIds)
  productListStore.fetchList({ categoryIds, brandIds, page: 1 })
}

onMounted(async () => {
  await Promise.all([
    categoryStore.fetchCategories(),
    brandStore.fetchBrands(),
  ])
  if (route.query.filters) {
    try { Object.assign(filterStore.values, JSON.parse(route.query.filters as string)) }
    catch { /* ignore malformed query */ }
  }
  if (route.query.sort) productListStore.sort = route.query.sort as string
  await loadProducts(route.query.category as string | undefined, route.query.brand as string | undefined)
})

watch(
  () => [route.query.category, route.query.brand],
  ([categorySlug, brandSlug]) => {
    loadProducts(categorySlug as string | undefined, brandSlug as string | undefined)
  },
)

const pageTitle = computed(() => {
  const categorySlug = route.query.category as string | undefined
  const brandSlug = route.query.brand as string | undefined
  if (categorySlug) {
    const path = getCategoryPath(categoryStore.items, categorySlug)
    return path.length ? path.map(c => c.name).join(' / ') : categorySlug
  }
  if (brandSlug) {
    return brandStore.findBySlug(brandSlug)?.name ?? brandSlug
  }
  return 'همه محصولات'
})

// Infinite scroll — sentinel sits right after the grid
const sentinel = ref<HTMLElement>()
useInfiniteScroll(sentinel, () => {
  productListStore.loadMore()
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex gap-6">
    <FilterSidebar />
    <div class="flex-1">
      <h1 class="text-lg font-semibold text-text-primary mb-4">{{ pageTitle }}</h1>
      <div class="flex gap-3 mb-4 lg:hidden">
        <ProductSortBar />
        <FilterMobileButton class="flex-1" />
      </div>
      <ProductSortBar class="hidden lg:flex" />

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        <template v-if="productListStore.isLoading">
          <div v-for="n in 12" :key="n" class="aspect-square rounded-2xl bg-surface-hover animate-pulse" />
        </template>
        <ProductCard v-else v-for="product in productListStore.items" :key="product.id" :product="product" />
      </div>

      <!-- Sentinel: triggers loadMore when scrolled into view -->
      <div ref="sentinel" class="h-4" />

      <div v-if="productListStore.isLoadingMore" class="flex justify-center py-6 gap-2 text-sm text-text-muted bg-accent/10 rounded-lg mt-4">
        <div class="size-6 rounded-full border-2 border-border-strong border-t-primary animate-spin" />
        <span>در حال بارگذاری...</span>
      </div>

      <p v-if="!productListStore.hasMore && productListStore.items.length" class="text-center text-xs text-text-muted py-6">
        محصول بیشتری برای نمایش وجود ندارد.
      </p>
    </div>
  </div>
</template>
