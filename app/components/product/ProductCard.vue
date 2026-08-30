<script setup lang="ts">
const props = defineProps<{ 
  product: Product
  variant?: 'default' | 'compact'
 }>()

const cartStore = useCartStore()

const discountPercent = computed(() => {
  if (!props.product.compareAtPrice) return null
  const off = 100 - (props.product.price / props.product.compareAtPrice) * 100
  return Math.round(off)
})

function addToCart() {
  cartStore.addItem(props.product.id)
}
</script>

<template>
  <div class="flex h-full flex-col rounded-2xl border border-border-strong bg-surface overflow-hidden">
    <NuxtLink :to="`/products/${product.slug}`" class="relative block aspect-square bg-surface-hover">
      <img :src="product.imageUrl" :alt="product.name" class="size-full object-cover" />

      <UiBadge v-if="discountPercent" variant="discount" class="absolute top-2 inset-s-2">
        {{ discountPercent }}%-
      </UiBadge>
      <UiBadge v-if="!product.inStock" variant="stock" class="absolute top-2 inset-e-2">
        ناموجود
      </UiBadge>
    </NuxtLink>

    <div class="flex flex-1 flex-col gap-2 p-3">
      <NuxtLink :to="`/products/${product.slug}`" class="text-sm text-text-primary line-clamp-2">
        {{ product.name }}
      </NuxtLink>

      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-text-primary">
          {{ product.price.toLocaleString('fa-IR') }} تومان
        </span>
        <span v-if="product.compareAtPrice" class="text-xs text-text-muted line-through">
          {{ product.compareAtPrice.toLocaleString('fa-IR') }}
        </span>
      </div>

      <UButton
        v-if="variant !== 'compact'"
        size="lg"
        class="mt-auto bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg"
        :disabled="!product.inStock || cartStore.isAdding"
        @click="addToCart"
      >
        افزودن به سبد
      </UButton>
    </div>
  </div>
</template>