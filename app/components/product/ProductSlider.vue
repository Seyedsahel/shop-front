<script setup lang="ts">
const props = defineProps<{ categoryId: string; title?: string; variant?: 'default' | 'compact' }>()
const productListStore = useProductListStore()

function loadPreview() {
  return callOnce(`preview:${props.categoryId}`, () => productListStore.fetchPreview(props.categoryId), { mode: 'navigation' })
}
if (import.meta.server) await loadPreview()
else onMounted(() => { void loadPreview() })
watch(() => props.categoryId, id => { void productListStore.fetchPreview(id) })

const products = computed(() => productListStore.previewsByCategory[props.categoryId] ?? [])
const isLoading = computed(() => productListStore.previewLoading[props.categoryId] ?? false)
</script>

<template>
  <UiOptionalSection :failed="!!productListStore.previewError[categoryId]">

  <UiSlider v-bind="$attrs"
  v-if="products.length || isLoading"
  :title="title"
  :is-loading="isLoading"
  :item-width-px="176"
  >
  <div v-for="product in products" :key="product.id" class="w-40 shrink-0 snap-start">
      <ProductCard :product="product" :variant="variant" />
    </div>

  </UiSlider>
  
  </UiOptionalSection>
</template>
