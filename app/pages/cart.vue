<script setup lang="ts">
const cartStore = useCartStore()
const toast = useAppToast()
onMounted(() => { void cartStore.fetchCart().catch(() => {}) })
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
          <CartItemCard v-for="item in cartStore.items" :key="item.id" :item="item" :disabled="cartStore.busy || cartStore.stale" @increase="changeQuantity(item, 1)" @decrease="changeQuantity(item, -1)" @remove="remove(item.id)" />
          <div class="flex gap-3 rounded-2xl border border-warning-border bg-warning-subtle p-4"><UIcon name="solar:verified-check-outline" class="size-6 shrink-0 text-warning" /><div><h2 class="text-sm font-semibold text-text-primary">خرید مطمئن از فروشگاه</h2><p class="mt-1 text-xs leading-6 text-text-secondary">جزئیات زمان و هزینه ارسال پس از انتخاب آدرس نمایش داده می‌شود.</p></div></div>
        </section>
        <div class="lg:col-span-4 lg:sticky lg:top-24"><CartOrderSummary :item-count="cartStore.itemCount" :subtotal-original="cartStore.subtotalOriginal" :total="cartStore.total" :disabled="cartStore.busy || cartStore.stale" :discount="cartStore.discount" @checkout="checkout" /></div>
      </div>
    </div>
  </div>
</template>
