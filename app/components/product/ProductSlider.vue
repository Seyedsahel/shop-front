<script setup lang="ts">
const props = defineProps<{ 
  category: string;
  title?: string
  variant?: 'default' | 'compact'
   }>()
const productStore = useProductStore()

onMounted(() => {
  productStore.fetchByCategory(props.category)
})

const products = computed(() => productStore.byCategory[props.category] ?? [])

</script>

<template>

  <UiSlider
  :title="title"
  :is-loading="productStore.isLoading"
  :item-width-px="176"
  >
  <div v-for="product in products" :key="product.id" class="w-40 shrink-0 snap-start">
      <ProductCard :product="product" :variant="variant" />
    </div>

  </UiSlider>
  
</template>
