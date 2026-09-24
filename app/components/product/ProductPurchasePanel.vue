<script setup lang="ts">
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()
const toast = useAppToast()
const props = defineProps<{ product: ProductDetail }>()

const quantity = ref(1)
const { attributes, selectedOptions, selectedVariant, select, reset } = useProductVariants(() => props.product.purchaseVariants)
const availableStock = computed(() => props.product.purchaseVariants.length
  ? selectedVariant.value?.stock ?? null
  : props.product.baseStock)
const unitPrice = computed(() => selectedVariant.value?.finalPrice ?? props.product.price.final)
const canShowDiscount = computed(() =>
  (!selectedVariant.value || selectedVariant.value.finalPrice === props.product.price.final)
  && props.product.price.discountPercent > 0
  && props.product.price.original > props.product.price.final,
)
const isInStock = computed(() => availableStock.value !== null && availableStock.value > 0)
const totalPrice = computed(() => unitPrice.value * quantity.value)
const favoriteItem = computed(() => wishlistStore.findItem(props.product.id, selectedVariant.value?.variantId))

onMounted(() => { void wishlistStore.fetchWishlist().catch(() => {}) })

watch(
  () => props.product.id,
  () => {
    reset()
    quantity.value = 1
  },
  { immediate: true },
)

watch(() => selectedVariant.value?.variantId, () => { quantity.value = 1 })

async function addToCart() {
  if (!isInStock.value || cartStore.busy || cartStore.stale) return
  if (props.product.purchaseVariants.length && !selectedVariant.value) return
  try {
    await cartStore.addItem(props.product.id, quantity.value, selectedVariant.value?.variantId ?? null)
    toast.success('محصول به سبد خرید اضافه شد.')
  } catch (error) {
    toast.error(error instanceof ApiError ? error.message : 'افزودن به سبد ناموفق بود.')
  }
}

async function toggleFavorite() {
  if (wishlistStore.busy || wishlistStore.stale || (props.product.purchaseVariants.length && !selectedVariant.value)) return
  try {
    if (favoriteItem.value) {
      if (!(await useConfirm('این کالا از علاقه‌مندی‌ها حذف شود؟'))) return
      await wishlistStore.remove(favoriteItem.value.id)
      toast.success('محصول از علاقه‌مندی‌ها حذف شد.')
    } else {
      await wishlistStore.addItem(props.product.id, selectedVariant.value?.variantId)
      toast.success('محصول به علاقه‌مندی‌ها اضافه شد.')
    }
  } catch (error) {
    toast.error(error instanceof ApiError ? error.message : 'تغییر علاقه‌مندی‌ها ناموفق بود.')
  }
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
        <UiBadge v-if="availableStock !== null" :variant="isInStock ? 'stock' : 'discount'">
          {{ isInStock ? `${availableStock.toLocaleString('fa-IR')} عدد موجود` : 'ناموجود' }}
        </UiBadge>
      </div>
    </div>

    <ProductVariantSelectors
      v-if="product.purchaseVariants.length"
      :attributes="attributes"
      :selected-options="selectedOptions"
      @select="select"
    />

    <div v-if="cartStore.stale" role="alert" class="text-sm text-danger">{{ cartStore.error }} <NuxtLink to="/cart" class="underline">بررسی و دریافت دوباره سبد</NuxtLink></div>
    <div v-if="wishlistStore.stale" role="alert" class="text-sm text-danger">{{ wishlistStore.error }} <button type="button" class="underline" :disabled="wishlistStore.busy" @click="wishlistStore.fetchWishlist().catch(() => {})">دریافت دوباره علاقه‌مندی‌ها</button></div>
    <div class="flex flex-col gap-3 sm:flex-row">
      <div class="flex h-12 w-full items-center justify-between rounded-xl border border-border-strong bg-card sm:w-36">
        <button type="button" class="grid size-11 place-items-center text-text-secondary hover:text-primary 
       disabled:opacity-40" :disabled="quantity <= 1" aria-label="کاهش تعداد" @click="quantity--">
          <UIcon name="solar:minus-circle-outline" class="size-5" />
        </button>
        <span class="text-sm font-semibold text-text-primary">{{ quantity.toLocaleString('fa-IR') }}</span>
        <button type="button" class="grid size-11 place-items-center text-text-secondary hover:text-primary disabled:opacity-40" :disabled="!isInStock || availableStock === null || quantity >= availableStock" aria-label="افزایش تعداد" @click="quantity++">
          <UIcon name="solar:add-circle-outline" class="size-5" />
        </button>
      </div>
      <div class="flex w-full gap-3 sm:flex-1">
        <button type="button" class="inline-flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-disabled-bg disabled:text-disabled-text sm:h-12 sm:py-0" :disabled="!isInStock || cartStore.busy || cartStore.stale" @click="addToCart">
          <UIcon name="solar:cart-large-2-outline" class="size-5 shrink-0" />
          <span class="truncate">{{ cartStore.isMutating ? 'در حال افزودن به سبد…' : availableStock === null ? 'گزینه محصول را انتخاب کنید' : isInStock ? `افزودن به سبد · ${formatMoney(totalPrice)}` : 'این محصول ناموجود است' }}</span>
        </button>
        <button type="button" class="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-secondary bg-primary-subtle text-danger transition-colors hover:bg-secondary-subtle hover:text-primary disabled:cursor-not-allowed disabled:opacity-50" :disabled="wishlistStore.busy || wishlistStore.stale || (product.purchaseVariants.length > 0 && !selectedVariant)" :aria-label="favoriteItem ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'" :aria-pressed="!!favoriteItem" @click="toggleFavorite">
          <UIcon :name="favoriteItem ? 'solar:heart-bold' : 'solar:heart-outline'" class="size-5" />
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
