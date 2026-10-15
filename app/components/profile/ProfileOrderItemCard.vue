<script setup lang="ts">
const props = defineProps<{ item: OrderItem }>()
const imageFailed = ref(false)

watch(() => props.item.image_url, () => { imageFailed.value = false })
</script>

<template>
  <article class="flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
    <div class="flex items-start gap-4">
      <div class="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface sm:size-24">
        <img
          v-if="item.image_url && !imageFailed"
          :src="item.image_url"
          :alt="item.product_name"
          loading="lazy"
          class="size-full object-contain"
          @error="imageFailed = true"
        >
        <UIcon v-else name="solar:gallery-remove-outline" class="size-9 text-text-muted" aria-hidden="true" />
      </div>
      <div class="min-w-0 flex-1">
        <h3 class="line-clamp-2 wrap-anywhere text-sm font-semibold leading-7 text-text-primary" :title="item.product_name"><bdi>{{ item.product_name }}</bdi></h3>
        <p class="mt-2 inline-flex rounded-lg bg-primary-subtle px-2.5 py-1 text-xs font-medium text-primary">تعداد سفارش: {{ item.quantity.toLocaleString('fa-IR') }} عدد</p>
        <p v-if="item.sku" class="mt-2 text-xs leading-5 text-text-muted">شناسه کالا: <bdi class="wrap-anywhere">{{ item.sku }}</bdi></p>
      </div>
    </div>
    <dl class="mt-auto space-y-2 border-t border-divider pt-3 text-sm">
      <div class="flex flex-wrap items-center justify-between gap-2"><dt class="text-text-secondary">قیمت هر عدد</dt><dd class="text-text-primary">{{ formatMoney(item.unit_price) }}</dd></div>
      <div class="flex flex-wrap items-center justify-between gap-2"><dt class="text-text-secondary">جمع این کالا</dt><dd class="font-bold text-text-primary">{{ formatMoney(item.total_amount) }}</dd></div>
    </dl>
  </article>
</template>
