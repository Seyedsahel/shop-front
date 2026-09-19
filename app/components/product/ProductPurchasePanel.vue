<script setup lang="ts">
const cartStore = useCartStore()
const toast = useAppToast()
const props = defineProps<{ product: ProductDetail }>()

const selectedVariantId = ref<string | null>(null)
const quantity = ref(1)
const selectedVariant = computed(() =>
  props.product.purchaseVariants.find(variant => variant.variantId === selectedVariantId.value) ?? null,
)
const availableStock = computed(() => selectedVariant.value?.stock ?? props.product.baseStock)
const unitPrice = computed(() => selectedVariant.value?.finalPrice ?? props.product.price.final)
const canShowDiscount = computed(() =>
  (!selectedVariant.value || selectedVariant.value.finalPrice === props.product.price.final)
  && props.product.price.discountPercent > 0
  && props.product.price.original > props.product.price.final,
)
const isInStock = computed(() => availableStock.value > 0)
const totalPrice = computed(() => unitPrice.value * quantity.value)

watch(
  () => props.product.id,
  () => {
    const firstAvailable = props.product.purchaseVariants.find(variant => variant.stock > 0)
    selectedVariantId.value = firstAvailable?.variantId ?? props.product.purchaseVariants[0]?.variantId ?? null
    quantity.value = 1
  },
  { immediate: true },
)

watch(availableStock, stock => {
  quantity.value = Math.min(Math.max(quantity.value, 1), Math.max(stock, 1))
})

async function addToCart() {
  if (!isInStock.value || cartStore.busy) return
  try {
    await cartStore.addItem(props.product.id, quantity.value, selectedVariantId.value)
    toast.success('محصول به سبد خرید اضافه شد.')
  } catch (error) {
    toast.error(error instanceof ApiError ? error.message : 'افزودن به سبد ناموفق بود.')
  }
}

function toggleFavorite() {
  // TODO: Connect this product to the favorites API when favorites are implemented.
}
</script>

<template>
  <section class="flex flex-col gap-5">
    <div class="space-y-2">
      <NuxtLink
        v-if="product.brand"
        :to="`/products?brand=${product.brand.slug}`"
        class="text-sm font-semibold text-primary hover:text-primary-hover"
      >
        {{ product.brand.name }}
      </NuxtLink>
      <h1 class="text-2xl font-bold leading-10 text-text-primary sm:text-3xl">{{ product.name }}</h1>
      <p v-if="product.description" class="text-sm leading-7 text-text-secondary sm:text-base">{{ product.description }}</p>
    </div>

    <div class="rounded-2xl bg-primary-subtle p-4 sm:p-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-baseline gap-2">
          <span class="text-2xl font-bold text-text-primary sm:text-3xl">{{ formatMoney(unitPrice) }}</span>
          <span v-if="canShowDiscount" class="text-sm text-text-muted line-through">{{ formatMoney(product.price.original) }}</span>
          <UiBadge v-if="canShowDiscount" variant="discount">{{ product.price.discountPercent.toLocaleString('fa-IR') }}٪ تخفیف</UiBadge>
        </div>
        <UiBadge :variant="isInStock ? 'stock' : 'discount'">
          {{ isInStock ? `${availableStock.toLocaleString('fa-IR')} عدد موجود` : 'ناموجود' }}
        </UiBadge>
      </div>
    </div>

    <div v-if="product.purchaseVariants.length" class="space-y-3">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-base font-semibold text-text-primary">انتخاب {{ product.purchaseVariants[0]?.name }}</h2>
        <span v-if="selectedVariant" class="text-xs text-text-muted">{{ selectedVariant.value }}</span>
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          v-for="variant in product.purchaseVariants"
          :key="variant.variantId"
          type="button"
          class="rounded-xl border p-4 text-start transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          :class="selectedVariantId === variant.variantId ? 'border-primary bg-primary-subtle ring-1 ring-primary' : 'border-border-strong bg-card hover:border-accent'"
          :disabled="variant.stock <= 0"
          @click="selectedVariantId = variant.variantId"
        >
          <span class="flex items-center justify-between gap-3 font-medium text-text-primary">
            <span>{{ variant.value }}</span>
            <span>{{ formatMoney(variant.finalPrice) }}</span>
          </span>
          <span class="mt-2 block text-xs" :class="variant.stock > 0 ? 'text-success' : 'text-danger'">
            {{ variant.stock > 0 ? `${variant.stock.toLocaleString('fa-IR')} عدد موجود` : 'ناموجود' }}
          </span>
        </button>
      </div>
    </div>

    <div v-if="cartStore.stale" role="alert" class="text-sm text-danger">{{ cartStore.error }} <NuxtLink to="/cart" class="underline">بررسی و دریافت دوباره سبد</NuxtLink></div>
    <div class="flex flex-col gap-3 sm:flex-row">
      <div class="flex h-12 w-full items-center justify-between rounded-xl border border-border-strong bg-card sm:w-36">
        <button type="button" class="grid size-11 place-items-center text-text-secondary hover:text-primary 
       disabled:opacity-40" :disabled="quantity <= 1" aria-label="کاهش تعداد" @click="quantity--">
          <UIcon name="solar:minus-circle-outline" class="size-5" />
        </button>
        <span class="text-sm font-semibold text-text-primary">{{ quantity.toLocaleString('fa-IR') }}</span>
        <button type="button" class="grid size-11 place-items-center text-text-secondary hover:text-primary disabled:opacity-40" :disabled="!isInStock || quantity >= availableStock" aria-label="افزایش تعداد" @click="quantity++">
          <UIcon name="solar:add-circle-outline" class="size-5" />
        </button>
      </div>
      <div class="flex w-full gap-3 sm:flex-1">
        <button type="button" class="inline-flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-disabled-bg disabled:text-disabled-text sm:h-12 sm:py-0" :disabled="!isInStock || cartStore.busy || cartStore.stale" @click="addToCart">
          <UIcon name="solar:cart-large-2-outline" class="size-5 shrink-0" />
          <span class="truncate">{{ cartStore.isMutating ? 'در حال افزودن به سبد…' : isInStock ? `افزودن به سبد · ${formatMoney(totalPrice)}` : 'این محصول ناموجود است' }}</span>
        </button>
        <button type="button" class="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-secondary bg-primary-subtle text-text-primary transition-colors hover:bg-secondary-subtle hover:text-primary" aria-label="افزودن به علاقه‌مندی‌ها" @click="toggleFavorite">
          <UIcon name="solar:heart-outline" class="size-5" />
        </button>
      </div>
    </div>

    <!-- TODO: Replace with backend-backed delivery and support promises when available. -->
    <div class="grid gap-3 sm:grid-cols-2">
      <div class="flex gap-3 rounded-xl border border-warning-border bg-warning-subtle p-3">
        <UIcon name="solar:delivery-outline" class="size-6 shrink-0 text-warning" />
        <div><h2 class="text-sm font-semibold text-text-primary">ارسال مطمئن</h2><p class="mt-1 text-xs leading-5 text-text-secondary">جزئیات زمان و هزینه ارسال هنگام ثبت سفارش نمایش داده می‌شود.</p></div>
      </div>
      <div class="flex gap-3 rounded-xl border border-info-border bg-info-subtle p-3">
        <UIcon name="solar:chat-round-line-outline" class="size-6 shrink-0 text-info" />
        <div><h2 class="text-sm font-semibold text-text-primary">نیاز به راهنمایی دارید؟</h2><p class="mt-1 text-xs leading-5 text-text-secondary">برای انتخاب محصول مناسب، از مشاوره فروشگاه کمک بگیرید.</p></div>
      </div>
    </div>
  </section>
</template>
