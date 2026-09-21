<script setup lang="ts">
defineProps<{ items: CartItem[]; subtotalOriginal: number; total: number; disabled?: boolean; discount: number; deliveryFee: number; methodLabel: string }>()
defineEmits<{ continue: [] }>()
</script>

<template>
  <aside class="rounded-2xl border border-border bg-card p-5 sm:p-6">
    <div class="flex items-center justify-between border-b border-divider pb-4"><h2 class="text-lg font-bold text-text-primary">خلاصه فاکتور</h2><span class="rounded-full bg-surface px-2 py-1 text-[10px] text-text-muted">مرحله ۲ از ۳</span></div>
    <div class="flex gap-2 overflow-hidden py-4"><div v-for="item in items.slice(0, 4)" :key="item.id" class="relative size-11 shrink-0 overflow-hidden rounded-lg bg-surface"><img v-if="item.image_url" :src="item.image_url" :alt="item.name" class="size-full object-cover" /><span class="absolute bottom-0 inset-e-0 grid size-4 place-items-center rounded-ss bg-primary text-[9px] text-primary-foreground">{{ item.quantity }}</span></div></div>
    <div class="space-y-3 border-y border-divider py-4 text-sm"><div class="flex justify-between text-text-secondary"><span>مبلغ کالاها</span><span>{{ formatMoney(subtotalOriginal) }}</span></div><div v-if="discount" class="flex justify-between text-success"><span>تخفیف</span><span>−{{ formatMoney(discount) }}</span></div><div class="flex justify-between text-text-secondary"><span>ارسال ({{ methodLabel }})</span><span>{{ deliveryFee ? formatMoney(deliveryFee) : 'رایگان' }}</span></div></div>
    <div class="flex justify-between pt-4"><span class="font-semibold text-text-primary">مبلغ قابل پرداخت</span><span class="text-lg font-bold text-primary">{{ formatMoney(total + deliveryFee) }}</span></div>
    <!-- TODO: Replace with Checkout/Payment API order creation and payment initiation. -->
    <button type="button" class="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover" :disabled="disabled" @click="$emit('continue')">ادامه و پرداخت نهایی<UIcon name="solar:arrow-left-outline" class="size-5" /></button>
    <NuxtLink to="/cart" class="mt-3 block text-center text-xs text-text-secondary hover:text-primary">بازگشت به سبد خرید</NuxtLink>
  </aside>
</template>
