<script setup lang="ts">
defineProps<{ orders: OrderSummary[] }>()
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2">
    <article v-for="order in orders" :key="order.id" class="rounded-2xl border border-border bg-card p-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="font-semibold text-text-primary">سفارش <bdi>{{ order.order_number }}</bdi></h3>
          <p class="mt-1 text-xs text-text-secondary">{{ orderDate(order.created_at) }}</p>
        </div>
        <span class="rounded-full bg-primary-subtle px-3 py-1 text-xs font-medium text-primary">{{ orderStatusLabel(order.status) }}</span>
      </div>
      <dl class="mt-4 space-y-2 border-t border-divider pt-4 text-sm">
        <div class="flex justify-between gap-4"><dt class="text-text-secondary">مبلغ سفارش</dt><dd class="font-semibold text-text-primary">{{ formatMoney(order.total_amount) }}</dd></div>
        <div class="flex justify-between gap-4"><dt class="text-text-secondary">روش تحویل</dt><dd class="text-text-primary">{{ order.shipping_method_name }}</dd></div>
      </dl>
      <NuxtLink :to="`/profile/orders/${order.id}`" class="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">مشاهده جزئیات <UIcon name="solar:arrow-left-outline" class="size-4" /></NuxtLink>
    </article>
  </div>
</template>
