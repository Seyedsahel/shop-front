<script setup lang="ts">
defineProps<{ itemCount: number; subtotal: number; discount: number; checkoutLabel?: string }>()
defineEmits<{ checkout: [] }>()
</script>

<template>
  <aside class="rounded-2xl border border-border bg-card p-5 sm:p-6">
    <h2 class="border-b border-divider pb-4 text-lg font-bold text-text-primary">خلاصه سفارش</h2>
    <div class="space-y-3 py-5 text-sm">
      <div class="flex items-center justify-between text-text-secondary"><span>قیمت کالاها ({{ itemCount.toLocaleString('fa-IR') }} عدد)</span><span>{{ subtotal.toLocaleString('fa-IR') }} تومان</span></div>
      <div v-if="discount" class="flex items-center justify-between text-success"><span>تخفیف شما</span><span>−{{ discount.toLocaleString('fa-IR') }} تومان</span></div>
      <div class="flex items-center justify-between text-text-secondary"><span>هزینه ارسال</span><span class="text-xs">در مرحله بعد محاسبه می‌شود</span></div>
    </div>
    <div class="flex items-center justify-between border-t border-divider pt-4"><span class="font-semibold text-text-primary">مبلغ قابل پرداخت</span><span class="text-lg font-bold text-primary">{{ (subtotal - discount).toLocaleString('fa-IR') }} تومان</span></div>
    <!-- TODO: Replace coupon validation with Cart API. -->
    <div class="mt-5 flex rounded-xl bg-surface p-1"><input type="text" class="min-w-0 flex-1 bg-transparent px-3 text-xs outline-none placeholder:text-text-muted" placeholder="کد تخفیف یا کارت هدیه" /><button type="button" class="rounded-lg bg-card px-3 py-2 text-xs font-semibold text-text-secondary">اعمال</button></div>
    <button type="button" class="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover" @click="$emit('checkout')">{{ checkoutLabel ?? 'ادامه و ثبت آدرس' }}<UIcon name="solar:arrow-left-outline" class="size-5" /></button>
    <div class="mt-5 grid grid-cols-3 gap-2 border-t border-divider pt-4 text-center text-[15px] text-text-secondary"><span class="inline-flex flex-col items-center gap-1"><UIcon name="solar:verified-check-outline" class="mx-auto mb-1 size-5 text-primary" />اصالت کالا</span><span class="inline-flex flex-col items-center gap-1"><UIcon name="solar:shield-check-outline" class="mx-auto mb-1 size-5 text-primary" />پرداخت امن</span><span class="inline-flex flex-col items-center gap-1"><UIcon name="solar:headphones-round-outline" class="mx-auto mb-1 size-5 text-primary" />پشتیبانی</span></div>
  </aside>
</template>
