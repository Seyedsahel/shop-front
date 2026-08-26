<!-- app/pages/category/[slug].vue -->
<script setup lang="ts">

const route = useRoute()
const router = useRouter()
const filterStore = useFilterStore()
const productListStore = useProductListStore()
const { activeSort } = useSort()

const category = computed(() => route.params.slug as string)

// Restore filters from the URL on load, so a shared link / refresh keeps state
onMounted(async () => {
  await filterStore.fetchFilters()
  if (route.query.filters) {
    try {
      const restored = JSON.parse(route.query.filters as string)
      Object.assign(filterStore.values, restored)
    } catch { /* ignore malformed query, fall back to defaults */ }
  }
})

// Any change to sort or filter values updates the URL...
watch([activeSort, () => filterStore.values], () => {
  router.replace({
    query: {
      ...route.query,
      sort: activeSort.value,
      filters: JSON.stringify(filterStore.values),
      page: 1, // reset pagination whenever sort/filters change
    },
  })
}, { deep: true })

// ...and the URL is what actually triggers the fetch, so back/forward and
// shared links behave correctly too, not just in-page interaction.
watch(() => route.query, () => {
  productListStore.fetchList({
    category: category.value,
    sort: route.query.sort as string,
    filters: route.query.filters as string,
    page: route.query.page ? Number(route.query.page) : 1,
  })
}, { immediate: true, deep: true })
</script>

<template>
    <h1>{{ category }}</h1>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex gap-6">
    <FilterSidebar />
    <div class="flex-1">
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
    </div>
  </div>
</template>