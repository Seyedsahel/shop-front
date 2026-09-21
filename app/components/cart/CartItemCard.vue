<script setup lang="ts">
const props = defineProps<{ item: CartItem; disabled?: boolean }>()
const emit = defineEmits<{ increase: []; decrease: []; remove: [] }>()

const lineTotal = computed(() => props.item.pricing.total)
const hasDiscount = computed(() => props.item.pricing.discount > 0)
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
          <UiBadge v-if="hasDiscount" variant="discount">تخفیف ویژه</UiBadge>
          <UiBadge :variant="item.stock > 0 ? 'stock' : 'discount'">{{ item.stock === 0 ? 'ناموجود' : item.stock > 3 ? 'موجود و آماده ارسال' : `تنها ${item.stock.toLocaleString('fa-IR')} عدد باقی مانده` }}</UiBadge>
        </div>
        <NuxtLink :to="`/products/${item.slug}`" class="line-clamp-2 text-sm font-semibold leading-7 text-text-primary hover:text-primary sm:text-base">{{ item.name }}</NuxtLink>
        <!-- TODO: Use the variant label supplied by the Cart API once the backend adds it. -->
        <p v-if="item.variant_id" class="mt-1 line-clamp-2 text-xs leading-6 text-text-secondary">گزینه: {{ item.variant_id }}</p>
      </div>
      <div class="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <div class="text-end">
          <div v-if="hasDiscount" class="text-xs text-text-muted line-through">{{ formatMoney(item.pricing.original_total) }}</div>
          <div class="text-base font-bold text-text-primary">{{ formatMoney(lineTotal) }}</div>
          <div class="text-xs text-text-muted">هر عدد {{ formatMoney(item.pricing.final_unit) }}</div>
        </div>
        <div class="flex h-10 items-center rounded-xl bg-surface p-1">
          <button type="button" class="grid size-8 place-items-center rounded-lg bg-card text-text-secondary transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40" :disabled="disabled || item.quantity >= item.stock" aria-label="افزایش تعداد" @click="emit('increase')"><UIcon name="solar:add-circle-outline" class="size-5" /></button>
          <span class="w-9 text-center text-sm font-bold text-text-primary">{{ item.quantity.toLocaleString('fa-IR') }}</span>
          <button type="button" class="grid size-8 place-items-center rounded-lg bg-card text-text-secondary transition-colors hover:bg-danger hover:text-danger-foreground" :disabled="disabled" aria-label="کاهش تعداد" @click="emit('decrease')"><UIcon name="solar:minus-circle-outline" class="size-5" /></button>
        </div>
      </div>
    </div>
    <div class="flex justify-end gap-4 border-t border-divider bg-surface/60 px-4 py-2 sm:px-5">
      <!-- TODO: Favorites API is not available; do not simulate moving/removing items. -->
      <button type="button" class="inline-flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-danger" :disabled="disabled" @click="emit('remove')"><UIcon name="solar:trash-bin-trash-outline" class="size-4" />حذف از سبد</button>
    </div>
  </article>
</template>
