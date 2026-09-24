<script setup lang="ts">
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()
const auth = useAuthStore()
const addresses = useAddressStore()
const checkoutStore = useCheckoutStore()
const toast = useAppToast()
const couponPending = ref(false)
const couponPreview = ref<CheckoutPreview | null>(null)
const previewSignature = ref('')
const cartSignature = computed(() => JSON.stringify({
  id: cartStore.cart?.id,
  items: cartStore.items.map(item => [item.id, item.quantity, item.pricing.total]),
}))
const activeCouponPreview = computed(() => previewSignature.value === cartSignature.value
  && checkoutStore.couponDraft.trim() === checkoutStore.couponCode ? couponPreview.value : null)
watch(cartSignature, () => { couponPreview.value = null })
onMounted(() => { void cartStore.fetchCart().catch(() => {}) })

async function applyCoupon() {
  if (couponPending.value || cartStore.busy || cartStore.stale || !cartStore.cart?.id) return
  const candidate = checkoutStore.couponDraft.trim()
  if (!candidate) {
    checkoutStore.couponCode = ''
    couponPreview.value = null
    toast.success('کد تخفیف حذف شد.')
    return
  }
  if (!auth.isAuthenticated) {
    auth.requireAuth('/cart')
    return
  }
  couponPending.value = true
  couponPreview.value = null
  try {
    if (!checkoutStore.methods.length) await checkoutStore.fetchMethods()
    const pickup = checkoutStore.methods.find(method => method.code === 'local_pickup')
    if (!pickup) throw new ApiError('روش تحویل حضوری برای بررسی کد تخفیف در دسترس نیست.')
    if (!addresses.loaded) await addresses.fetchAll()
    const address = addresses.items[0]
    const input: CheckoutInput = {
      cart_id: cartStore.cart.id,
      shipping_method_id: pickup.id,
      ...(address ? { address_id: address.id } : {}),
      coupon_code: candidate,
    }
    const result = await checkoutStore.fetchPreview(input)
    if (!result) return
    checkoutStore.couponCode = candidate
    couponPreview.value = result
    previewSignature.value = cartSignature.value
    toast.success('کد تخفیف با پیش‌نمایش سفارش بررسی شد.')
  } catch (error) {
    toast.error(error instanceof ApiError ? error.message : 'بررسی کد تخفیف ناموفق بود.')
  } finally {
    couponPending.value = false
  }
}
async function run(action: () => Promise<unknown>, message: string) {
  try { await action(); toast.success(message) }
  catch (error) { toast.error(error instanceof ApiError ? error.message : 'عملیات ناموفق بود.') }
}
async function remove(id: string) {
  if (await useConfirm('این کالا از سبد حذف شود؟')) void run(() => cartStore.remove(id), 'کالا از سبد حذف شد.')
}
function changeQuantity(item: CartItem, amount: number) {
  if (item.quantity + amount < 1) return remove(item.id)
  void run(() => cartStore.updateQuantity(item.id, item.quantity + amount), 'تعداد کالا به‌روزرسانی شد.')
}
async function clear() {
  if (await useConfirm('همه کالاهای سبد حذف شوند؟')) void run(cartStore.clear, 'سبد خرید خالی شد.')
}
async function moveToWishlist(item: CartItem) {
  if (cartStore.busy || cartStore.stale || wishlistStore.busy) return
  let savedToWishlist = false
  try {
    if (!wishlistStore.loaded || wishlistStore.stale) await wishlistStore.fetchWishlist()
    if (!wishlistStore.findItem(item.product_id, item.variant_id)) {
      await wishlistStore.addItem(item.product_id, item.variant_id)
    }
    savedToWishlist = true
    await cartStore.remove(item.id)
    toast.success('کالا به علاقه‌مندی‌ها منتقل شد.')
  } catch (error) {
    if (savedToWishlist) {
      toast.error('کالا به علاقه‌مندی‌ها اضافه شد، اما حذف آن از سبد خرید ناموفق بود. دوباره تلاش کنید.')
    } else {
      toast.error(error instanceof ApiError ? error.message : 'انتقال کالا به علاقه‌مندی‌ها ناموفق بود.')
    }
  }
}
function checkout() {
  if (cartStore.items.length && !cartStore.busy && !cartStore.stale) navigateTo('/checkout')
}
</script>

<template>
  <div>
    <CartCheckoutStepper :step="1" />
    <div class="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <p v-if="cartStore.isMutating" role="status" class="mb-3 text-sm text-text-secondary">در حال به‌روزرسانی سبد خرید…</p>
      <div v-if="cartStore.error" role="alert" class="mb-4 rounded-xl border border-danger-border p-4 text-danger">{{ cartStore.error }}<button type="button" class="mx-3 underline" :disabled="cartStore.busy" @click="cartStore.fetchCart().catch(() => {})">دریافت دوباره سبد</button></div>
      <div v-if="cartStore.isLoading || !cartStore.loaded" role="status" class="p-8 text-center">{{ cartStore.error ? 'سبد خرید در دسترس نیست.' : 'در حال دریافت سبد خرید…' }}</div>
      <CartEmptyState v-else-if="!cartStore.items.length && !cartStore.error" />
      <div v-if="cartStore.loaded && cartStore.items.length" class="grid items-start gap-6 lg:grid-cols-12">
        <section class="space-y-4 lg:col-span-8">
          <div class="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-4 sm:px-5">
            <div class="flex items-center gap-2"><h1 class="text-lg font-bold text-text-primary">سبد خرید شما</h1><span class="rounded-full bg-surface px-2 py-1 text-[10px] text-text-secondary">{{ cartStore.itemCount.toLocaleString('fa-IR') }} کالا</span></div>
            <button type="button" class="inline-flex items-center gap-1 text-xs text-text-secondary transition-colors hover:text-danger" :disabled="cartStore.busy || cartStore.stale" @click="clear"><UIcon name="solar:trash-bin-trash-outline" class="size-4" />خالی کردن سبد</button>
          </div>
          <CartItemCard v-for="item in cartStore.items" :key="item.id" :item="item" :disabled="cartStore.busy || cartStore.stale || wishlistStore.busy" @increase="changeQuantity(item, 1)" @decrease="changeQuantity(item, -1)" @remove="remove(item.id)" @move-to-wishlist="moveToWishlist(item)" />
          <div class="flex gap-3 rounded-2xl border border-warning-border bg-warning-subtle p-4"><UIcon name="solar:verified-check-outline" class="size-6 shrink-0 text-warning" /><div><h2 class="text-sm font-semibold text-text-primary">خرید مطمئن از فروشگاه</h2><p class="mt-1 text-xs leading-6 text-text-secondary">جزئیات زمان و هزینه ارسال پس از انتخاب آدرس نمایش داده می‌شود.</p></div></div>
        </section>
        <div class="lg:col-span-4 lg:sticky lg:top-24"><CartOrderSummary v-model:coupon="checkoutStore.couponDraft" :item-count="cartStore.itemCount" :subtotal-original="cartStore.subtotalOriginal" :total="cartStore.total" :disabled="cartStore.busy || cartStore.stale || couponPending" :discount="cartStore.discount" :preview="activeCouponPreview" :coupon-pending="couponPending" :coupon-applied="!!activeCouponPreview && !!checkoutStore.couponCode" @apply-coupon="applyCoupon" @checkout="checkout" /></div>
      </div>
    </div>
  </div>
</template>
