<script setup lang="ts">
const props = defineProps<{ product: Product }>()
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
  <div class="flex flex-col rounded-2xl border border-border-strong bg-surface overflow-hidden">
    <NuxtLink :to="`/products/${product.slug}`" class="relative block aspect-square bg-surface-hover">
      <img :src="product.imageUrl" :alt="product.name" class="size-full object-cover" />

      <UiBadge v-if="discountPercent" variant="danger" class="absolute top-2 inset-s-2">
        {{ discountPercent }}%-
      </UiBadge>
      <UiBadge v-if="!product.inStock" class="absolute top-2 inset-e-2">
        ناموجود
      </UiBadge>
    </NuxtLink>

    <div class="flex flex-col gap-2 p-3">
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
        size="sm"
        class="bg-secondary hover:bg-secondary/80 text-text-on-dark rounded-lg mt-1"
        :disabled="!product.inStock || cartStore.isAdding"
        @click="addToCart"
      >
        افزودن به سبد
      </UButton>
    </div>
  </div>
</template>