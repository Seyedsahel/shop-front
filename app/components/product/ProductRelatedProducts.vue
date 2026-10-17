<script setup lang="ts">
const props = defineProps<{ categoryId?: string; currentProductId: string }>()
const productListStore = useProductListStore()


if (props.categoryId) await callOnce(`preview:${props.categoryId}`, () => productListStore.fetchPreview(props.categoryId!), { mode: 'navigation' })
watch(() => props.categoryId, id => { if (id) void productListStore.fetchPreview(id) })

const products = computed(() =>
  props.categoryId
    ? (productListStore.previewsByCategory[props.categoryId] ?? []).filter(product => product.id !== props.currentProductId)
    : [],
)
const isLoading = computed(() => props.categoryId ? productListStore.previewLoading[props.categoryId] ?? false : false)
</script>

<template>
  <UiOptionalSection :failed="!!(categoryId && productListStore.previewError[categoryId])">
  <UiSlider v-bind="$attrs" v-if="categoryId && (isLoading || products.length)" title="محصولات مرتبط" :is-loading="isLoading" :item-width-px="200">
    <div v-for="product in products" :key="product.id" class="w-48 shrink-0 snap-start"><ProductCard :product="product" variant="compact" /></div>
  </UiSlider>
  </UiOptionalSection>
</template>
