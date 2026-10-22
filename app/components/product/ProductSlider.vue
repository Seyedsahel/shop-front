<script setup lang="ts">
defineProps<{ products: Product[]; isLoading?: boolean; title?: string; variant?: 'default' | 'compact' }>()
</script>

<template>
  <UiSlider
    v-if="products.length || isLoading"
    v-bind="$attrs"
    :title="title"
    :is-loading="isLoading"
    :item-width-px="176"
  >
    <div v-for="product in products" :key="product.id" class="w-40 shrink-0 snap-start">
      <ProductCard :product="product" :variant="variant" />
    </div>
  </UiSlider>
</template>
