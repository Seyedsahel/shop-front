<script setup lang="ts">
const props = defineProps<{ product: Product; variant?: 'default' | 'compact' }>()
const cartStore = useCartStore()
const toast = useAppToast()
const quickAddOpen = ref(false)

const inStock = computed(() => props.product.stock > 0)
const finalPrice = computed(() => props.product.price?.final ?? props.product.basePrice)
const hasDiscount = computed(() => (props.product.price?.discountPercent ?? 0) > 0)
const cartItem = computed(() => cartStore.items.find(item => item.product_id === props.product.id))
const cartActionDisabled = computed(() => cartStore.busy || cartStore.stale)

function addToCart() {
  quickAddOpen.value = true
}

async function changeQuantity(amount: number) {
  const item = cartItem.value
  if (!item || cartActionDisabled.value) return

  try {
    if (amount < 0 && item.quantity === 1) {
      if (!(await useConfirm('این کالا از سبد حذف شود؟'))) return
      await cartStore.remove(item.id)
      toast.success('کالا از سبد حذف شد.')
      return
    }
    await cartStore.updateQuantity(item.id, item.quantity + amount)
    toast.success('تعداد کالا به‌روزرسانی شد.')
  } catch (error) {
    toast.error(error instanceof ApiError ? error.message : 'به‌روزرسانی سبد ناموفق بود.')
  }
}
</script>

<template>
  <div class="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border-strong bg-surface">
    <NuxtLink :to="`/products/${product.slug}`" :aria-label="`مشاهده ${product.name}`" class="absolute inset-0 z-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-primary" />
    <div class="pointer-events-none relative z-10 flex flex-1 flex-col gap-2">
      <div class="relative aspect-square bg-surface-hover">
        <img :src="product.imageUrl" :alt="product.name" class="size-full object-cover" />
        <UiBadge v-if="!inStock" variant="stock" class="absolute top-2 inset-e-2">ناموجود</UiBadge>
      </div>

      <div class="flex flex-1 flex-col gap-2 p-3">
        <span class="line-clamp-2 text-sm text-text-primary">{{ product.name }}</span>

        <div class="flex flex-col gap-1">
          <div v-if="hasDiscount" class="flex items-center gap-2">
            <span class="rounded-full bg-danger text-danger-foreground px-2 py-0.5 text-[11px] font-bold">
              {{ product.price.discountPercent.toLocaleString('fa-IR') }}٪
            </span>
            <span class="text-xs text-text-muted line-through">{{ formatMoney(product.price.original) }}</span>
          </div>
          <span class="text-sm font-semibold text-text-primary">{{ formatMoney(finalPrice) }}</span>
        </div>

        <div v-if="variant !== 'compact'" class="pointer-events-auto mt-auto">
          <div v-if="cartItem" class="flex min-h-11 items-center justify-between rounded-lg bg-primary px-1 text-primary-foreground">
            <button type="button" class="grid size-9 place-items-center rounded-md transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40" aria-label="کاهش تعداد" :disabled="cartActionDisabled" @click="changeQuantity(-1)"><UIcon name="solar:minus-circle-outline" class="size-5" /></button>
            <output class="min-w-8 text-center text-sm font-bold">{{ cartItem.quantity.toLocaleString('fa-IR') }}</output>
            <button type="button" class="grid size-9 place-items-center rounded-md transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40" aria-label="افزایش تعداد" :disabled="cartActionDisabled || cartItem.stock === null || cartItem.quantity >= cartItem.stock" @click="changeQuantity(1)"><UIcon name="solar:add-circle-outline" class="size-5" /></button>
          </div>
          <button v-else type="button" class="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50" :disabled="!inStock" @click="addToCart">افزودن به سبد</button>
        </div>
      </div>
    </div>
    <ProductQuickAdd v-if="quickAddOpen" v-model="quickAddOpen" :product="product" />
  </div>
</template>
