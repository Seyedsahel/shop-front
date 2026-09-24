<script setup lang="ts">
const coupon = defineModel<string>('coupon', { required: true })
defineProps<{ itemCount: number; subtotalOriginal: number; total: number; disabled?: boolean; discount: number; checkoutLabel?: string; preview?: CheckoutPreview | null; couponPending?: boolean; couponApplied?: boolean }>()
defineEmits<{ checkout: []; applyCoupon: [] }>()
</script>

<template>
  <aside class="rounded-2xl border border-border bg-card p-5 sm:p-6">
    <h2 class="border-b border-divider pb-4 text-lg font-bold text-text-primary">خلاصه سفارش</h2>
    <div class="space-y-3 py-5 text-sm">
      <div class="flex items-center justify-between text-text-secondary"><span>قیمت کالاها ({{ itemCount.toLocaleString('fa-IR') }} عدد)</span><span>{{ formatMoney(preview?.subtotal ?? subtotalOriginal) }}</span></div>
      <div v-if="preview?.discount_amount || (!preview && discount)" class="flex items-center justify-between text-success"><span>تخفیف شما</span><span>−{{ formatMoney(preview?.discount_amount ?? discount) }}</span></div>
      <div class="flex items-center justify-between text-text-secondary"><span>هزینه ارسال</span><span class="text-xs">در مرحله بعد محاسبه می‌شود</span></div>
    </div>
    <div class="flex items-center justify-between border-t border-divider pt-4"><span class="font-semibold text-text-primary">جمع کالاها</span><span class="text-lg font-bold text-primary">{{ formatMoney(preview?.total_amount ?? total) }}</span></div>
    <CartCouponInput v-model="coupon" class="mt-5" :disabled="disabled" :pending="couponPending" :applied="couponApplied" @apply="$emit('applyCoupon')" />
    <p v-if="coupon.trim() && !couponApplied" class="mt-2 text-xs text-warning">برای محاسبه تخفیف، کد را اعمال کنید.</p>
    <button type="button" class="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover" :disabled="disabled" @click="$emit('checkout')">{{ checkoutLabel ?? 'ادامه و ثبت آدرس' }}<UIcon name="solar:arrow-left-outline" class="size-5" /></button>
    <div class="mt-5 grid grid-cols-3 gap-2 border-t border-divider pt-4 text-center text-[15px] text-text-secondary"><span class="inline-flex flex-col items-center gap-1"><UIcon name="solar:verified-check-outline" class="mx-auto mb-1 size-5 text-primary" />اصالت کالا</span><span class="inline-flex flex-col items-center gap-1"><UIcon name="solar:shield-check-outline" class="mx-auto mb-1 size-5 text-primary" />پرداخت امن</span><span class="inline-flex flex-col items-center gap-1"><UIcon name="solar:headphones-round-outline" class="mx-auto mb-1 size-5 text-primary" />پشتیبانی</span></div>
  </aside>
</template>
