<script setup lang="ts">
const route = useRoute()
const filterStore = useFilterStore()
const productListStore = useProductListStore()

onMounted(() => filterStore.fetchFilters())

watch(() => [route.query.category, route.query.brand], () => {
  productListStore.fetchList({
    category: route.query.category as string | undefined,
    brand: route.query.brand as string | undefined,
  })
}, { immediate: true })

const pageTitle = computed(() => {
  if (route.query.category) return `دسته‌بندی: ${route.query.category}`
  if (route.query.brand) return `برند: ${route.query.brand}`
  return 'همه محصولات'
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
    </div>
  </div>
</template>