<script setup lang="ts">
const wishlistStore = useWishlistStore()
const cartStore = useCartStore()
const toast = useAppToast()
onMounted(() => { void wishlistStore.fetchWishlist().catch(() => {}) })

async function run(action: () => Promise<unknown>, message: string) {
  try { await action(); toast.success(message) }
  catch (error) { toast.error(error instanceof ApiError ? error.message : 'عملیات ناموفق بود.') }
}
async function remove(id: string) {
  if (await useConfirm('این کالا از علاقه‌مندی‌ها حذف شود؟')) void run(() => wishlistStore.remove(id), 'کالا از علاقه‌مندی‌ها حذف شد.')
}
async function clear() {
  if (await useConfirm('همه کالاهای علاقه‌مندی‌ها حذف شوند؟')) void run(wishlistStore.clear, 'علاقه‌مندی‌ها خالی شد.')
}
async function addToCart(item: WishlistItem) {
  if (cartStore.busy || cartStore.stale || wishlistStore.busy || wishlistStore.stale) return
  let addedToCart = false
  try {
    await cartStore.addItem(item.product_id, 1, item.variant_id || null)
    addedToCart = true
    await wishlistStore.remove(item.id)
    toast.success('کالا به سبد خرید منتقل شد.')
  } catch (error) {
    if (addedToCart) {
      toast.error('کالا به سبد اضافه شد، اما حذف آن از علاقه‌مندی‌ها ناموفق بود. دوباره تلاش کنید.')
    } else {
      toast.error(error instanceof ApiError ? error.message : 'انتقال کالا به سبد خرید ناموفق بود.')
    }
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
    <div class="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-4 sm:px-5">
      <div class="flex items-center gap-2"><h1 class="text-lg font-bold text-text-primary">علاقه‌مندی‌های شما</h1><span class="rounded-full bg-surface px-2 py-1 text-[10px] text-text-secondary">{{ wishlistStore.itemCount.toLocaleString('fa-IR') }} کالا</span></div>
      <button v-if="wishlistStore.items.length" type="button" class="inline-flex items-center gap-1 text-xs text-text-secondary transition-colors hover:text-danger" :disabled="wishlistStore.busy || wishlistStore.stale" @click="clear"><UIcon name="solar:trash-bin-trash-outline" class="size-4" />خالی کردن علاقه‌مندی‌ها</button>
    </div>
    <p v-if="wishlistStore.isMutating" role="status" class="mb-3 text-sm text-text-secondary">در حال به‌روزرسانی علاقه‌مندی‌ها…</p>
    <div v-if="wishlistStore.error" role="alert" class="mb-4 rounded-xl border border-danger-border p-4 text-danger">{{ wishlistStore.error }}<button type="button" class="mx-3 underline" :disabled="wishlistStore.busy" @click="wishlistStore.fetchWishlist().catch(() => {})">دریافت دوباره علاقه‌مندی‌ها</button></div>
    <div v-if="wishlistStore.isLoading || !wishlistStore.loaded" role="status" class="p-8 text-center">{{ wishlistStore.error ? 'علاقه‌مندی‌ها در دسترس نیست.' : 'در حال دریافت علاقه‌مندی‌ها…' }}</div>
    <section v-else-if="!wishlistStore.items.length && !wishlistStore.error" class="flex min-h-90 flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-card p-8 text-center">
      <span class="grid size-18 place-items-center rounded-full bg-primary-subtle text-primary"><UIcon name="solar:heart-outline" class="size-9" /></span>
      <h2 class="mt-5 text-xl font-bold text-text-primary">علاقه‌مندی‌های شما خالی است</h2>
      <p class="mt-2 max-w-sm text-sm leading-7 text-text-secondary">محصولات مورد علاقه‌تان را ذخیره کنید تا اینجا ببینید.</p>
      <NuxtLink to="/products" class="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover">مشاهده محصولات</NuxtLink>
    </section>
    <section v-if="wishlistStore.loaded && wishlistStore.items.length" class="space-y-4">
      <WishlistItemCard v-for="item in wishlistStore.items" :key="item.id" :item="item" :disabled="wishlistStore.busy || wishlistStore.stale || cartStore.busy" :cart-busy="cartStore.busy || cartStore.stale" @remove="remove(item.id)" @add-to-cart="addToCart(item)" />
    </section>
  </div>
</template>
