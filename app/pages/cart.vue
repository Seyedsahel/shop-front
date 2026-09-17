<script setup lang="ts">
const cartStore = useCartStore()

function checkout() {
  if (cartStore.items.length) navigateTo('/checkout')
}
</script>

<template>
  <div>
    <CartCheckoutStepper :step="1" />
    <div class="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <CartEmptyState v-if="!cartStore.items.length" />
      <div v-else class="grid items-start gap-6 lg:grid-cols-12">
        <section class="space-y-4 lg:col-span-8">
          <div class="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-4 sm:px-5">
            <div class="flex items-center gap-2"><h1 class="text-lg font-bold text-text-primary">سبد خرید شما</h1><span class="rounded-full bg-surface px-2 py-1 text-[10px] text-text-secondary">{{ cartStore.itemCount.toLocaleString('fa-IR') }} کالا</span></div>
            <!-- TODO: Replace clear-cart mutation with Cart API. -->
            <button type="button" class="inline-flex items-center gap-1 text-xs text-text-secondary transition-colors hover:text-danger" @click="cartStore.clear"><UIcon name="solar:trash-bin-trash-outline" class="size-4" />خالی کردن سبد</button>
          </div>
          <!-- TODO: Replace cart and favorites mutations with Cart API and Favorites API. -->
          <CartItemCard v-for="item in cartStore.items" :key="item.id" :item="item" @increase="cartStore.increase(item.id)" @decrease="cartStore.decrease(item.id)" @remove="cartStore.remove(item.id)" @move-to-wishlist="cartStore.moveToWishlist(item.id)" />
          <div class="flex gap-3 rounded-2xl border border-warning-border bg-warning-subtle p-4"><UIcon name="solar:verified-check-outline" class="size-6 shrink-0 text-warning" /><div><h2 class="text-sm font-semibold text-text-primary">خرید مطمئن از فروشگاه</h2><p class="mt-1 text-xs leading-6 text-text-secondary">جزئیات زمان و هزینه ارسال پس از انتخاب آدرس نمایش داده می‌شود.</p></div></div>
        </section>
        <div class="lg:col-span-4 lg:sticky lg:top-24"><CartOrderSummary :item-count="cartStore.itemCount" :subtotal="cartStore.subtotal" :discount="cartStore.discount" @checkout="checkout" /></div>
      </div>
    </div>
  </div>
</template>
