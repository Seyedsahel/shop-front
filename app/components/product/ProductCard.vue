<script setup lang="ts">
const props = defineProps<{ product: Product; variant?: 'default' | 'compact' }>()
const cartStore = useCartStore()

const inStock = computed(() => props.product.stock > 0)
const finalPrice = computed(() => props.product.price?.final ?? props.product.basePrice)
const hasDiscount = computed(() => (props.product.price?.discountPercent ?? 0) > 0)

function addToCart() {
  cartStore.addItem(props.product.id)
}
</script>

<template>
  <div class="flex h-full flex-col rounded-2xl border border-border-strong bg-surface overflow-hidden">
    <NuxtLink :to="`/products/${product.slug}`" class="relative block aspect-square bg-surface-hover">
      <img :src="product.imageUrl" :alt="product.name" class="size-full object-cover" />
      <UiBadge v-if="!inStock" variant="stock" class="absolute top-2 inset-e-2">ناموجود</UiBadge>
    </NuxtLink>

    <div class="flex flex-1 flex-col gap-2 p-3">
      <NuxtLink :to="`/products/${product.slug}`" class="text-sm text-text-primary line-clamp-2">
        {{ product.name }}
      </NuxtLink>

      <div class="flex flex-col gap-1">
        <div v-if="hasDiscount" class="flex items-center gap-2">
          <span class="rounded-full bg-danger text-danger-foreground px-2 py-0.5 text-[11px] font-bold">
            {{ product.price.discountPercent.toLocaleString('fa-IR') }}٪
          </span>
          <span class="text-xs text-text-muted line-through">
            {{ product.price.original.toLocaleString('fa-IR') }}
          </span>
        </div>
        <span class="text-sm font-semibold text-text-primary">
          {{ finalPrice.toLocaleString('fa-IR') }} تومان
        </span>
      </div>

      <button
        v-if="variant !== 'compact'"
        type="button"
        class="mt-auto inline-flex min-h-11 items-center justify-center bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!inStock || cartStore.isAdding"
        @click="addToCart"
      >
        افزودن به سبد
      </button>
    </div>
  </div>
</template>
