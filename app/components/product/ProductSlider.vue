<script setup lang="ts">
const props = defineProps<{ categoryId: string; title?: string; variant?: 'default' | 'compact' }>()
const productListStore = useProductListStore()

onMounted(() => productListStore.fetchPreview(props.categoryId))

const products = computed(() => productListStore.previewsByCategory[props.categoryId] ?? [])
const isLoading = computed(() => productListStore.previewLoading[props.categoryId] ?? false)
</script>

<template>

  <UiSlider
  :title="title"
  :is-loading="isLoading"
  :item-width-px="176"
  >
  <div v-for="product in products" :key="product.id" class="w-40 shrink-0 snap-start">
      <ProductCard :product="product" :variant="variant" />
    </div>

  </UiSlider>
  
</template>
