<script setup lang="ts">
defineProps<{ item: WishlistItem; disabled?: boolean; cartBusy?: boolean }>()
const emit = defineEmits<{ remove: []; addToCart: [] }>()
</script>

<template>
  <article class="overflow-hidden rounded-2xl border border-border bg-card">
    <div class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
      <NuxtLink :to="`/products/${item.slug}`" class="size-24 shrink-0 overflow-hidden rounded-xl bg-surface sm:size-28">
        <img v-if="item.image_url" :src="item.image_url" :alt="item.name" class="size-full object-cover" />
        <UIcon v-else name="solar:gallery-outline" class="m-auto size-10 text-text-muted" />
      </NuxtLink>
      <div class="min-w-0 flex-1">
        <div class="mb-2 flex flex-wrap gap-2">
          <UiBadge v-if="item.price.discount > 0" variant="discount">{{ item.price.discount_percent.toLocaleString('fa-IR') }}٪ تخفیف</UiBadge>
          <UiBadge :variant="item.stock > 0 ? 'stock' : 'discount'">{{ item.stock === 0 ? 'ناموجود' : 'موجود و آماده ارسال' }}</UiBadge>
        </div>
        <NuxtLink :to="`/products/${item.slug}`" class="line-clamp-2 text-sm font-semibold leading-7 text-text-primary hover:text-primary sm:text-base">{{ item.name }}</NuxtLink>
        <p v-if="item.variant_name" class="mt-1 line-clamp-2 text-xs leading-6 text-text-secondary">گزینه: {{ item.variant_name }}</p>
      </div>
      <div class="text-end">
        <div v-if="item.price.discount > 0" class="text-xs text-text-muted line-through">{{ formatMoney(item.price.original) }}</div>
        <div class="text-base font-bold text-text-primary">{{ formatMoney(item.price.final) }}</div>
      </div>
    </div>
    <div class="flex flex-wrap justify-end gap-4 border-t border-divider bg-surface/60 px-4 py-2 sm:px-5">
      <button type="button" class="inline-flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-primary disabled:opacity-50" :disabled="disabled || cartBusy || item.stock < 1" @click="emit('addToCart')"><UIcon name="solar:cart-large-2-outline" class="size-4" />انتقال به سبد</button>
      <button type="button" class="inline-flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-danger disabled:opacity-50" :disabled="disabled" @click="emit('remove')"><UIcon name="solar:trash-bin-trash-outline" class="size-4" />حذف از علاقه‌مندی‌ها</button>
    </div>
  </article>
</template>
