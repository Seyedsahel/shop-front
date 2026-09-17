<script setup lang="ts">
const props = defineProps<{ categoryId?: string; currentProductId: string }>()
const productListStore = useProductListStore()

// TODO: Replace this category-preview fallback with the dedicated related-products backend response when available.
onMounted(() => {
  if (props.categoryId) productListStore.fetchPreview(props.categoryId)
})

const products = computed(() =>
  props.categoryId
    ? (productListStore.previewsByCategory[props.categoryId] ?? []).filter(product => product.id !== props.currentProductId)
    : [],
)
const isLoading = computed(() => props.categoryId ? productListStore.previewLoading[props.categoryId] ?? false : false)
</script>

<template>
  <UiSlider v-if="categoryId && (isLoading || products.length)" title="محصولات مرتبط" :is-loading="isLoading" :item-width-px="200">
    <div v-for="product in products" :key="product.id" class="w-48 shrink-0 snap-start"><ProductCard :product="product" variant="compact" /></div>
  </UiSlider>
</template>
