<script setup lang="ts">
const coupon = defineModel<string>('coupon', { required: true })
const props = defineProps<{ items: CartItem[]; preview: CheckoutPreview | null; method: ShippingMethod | null | undefined; methodName: string; subtotalOriginal: number; cartDiscount: number; cartTotal: number; pending?: boolean; disabled?: boolean; couponDisabled?: boolean; couponApplied?: boolean }>()
defineEmits<{ applyCoupon: []; continue: [] }>()
const estimatedShipping = computed(() => props.method?.price_strategy === 'fixed' ? props.method.fixed_price : props.method?.price_strategy === 'free' ? 0 : null)
const displayedTotal = computed(() => props.preview?.total_amount ?? props.cartTotal + (estimatedShipping.value ?? 0))
</script>

<template>
  <aside class="rounded-2xl border border-border bg-card p-5 sm:p-6">
    <div class="flex items-center justify-between border-b border-divider pb-4"><h2 class="text-lg font-bold text-text-primary">خلاصه فاکتور</h2><span class="rounded-full bg-surface px-2 py-1 text-[10px] text-text-muted">مرحله ۲ از ۳</span></div>
    <div class="flex gap-2 overflow-hidden py-4"><div v-for="item in items.slice(0, 4)" :key="item.id" class="relative size-11 shrink-0 overflow-hidden rounded-lg bg-surface"><img v-if="item.image_url" :src="item.image_url" :alt="item.name" class="size-full object-cover" /><span class="absolute bottom-0 inset-e-0 grid size-4 place-items-center rounded-ss bg-primary text-[9px] text-primary-foreground">{{ item.quantity }}</span></div></div>
    <div class="space-y-3 border-y border-divider py-4 text-sm">
      <div class="flex justify-between text-text-secondary"><span>مبلغ کالاها</span><span>{{ formatMoney(preview?.subtotal ?? subtotalOriginal) }}</span></div>
      <div v-if="preview?.discount_amount || (!preview && cartDiscount)" class="flex justify-between text-success"><span>تخفیف</span><span>−{{ formatMoney(preview?.discount_amount ?? cartDiscount) }}</span></div>
      <div class="flex justify-between text-text-secondary"><span>ارسال {{ methodName ? `(${methodName})` : '' }}</span><span>{{ preview ? (preview.shipping_amount ? formatMoney(preview.shipping_amount) : 'رایگان') : estimatedShipping === null ? 'پس از محاسبه' : estimatedShipping ? formatMoney(estimatedShipping) : 'رایگان' }}</span></div>
      <div v-if="preview?.tax_amount" class="flex justify-between text-text-secondary"><span>مالیات</span><span>{{ formatMoney(preview.tax_amount) }}</span></div>
    </div>
    <div class="flex justify-between pt-4"><span class="font-semibold text-text-primary">{{ preview ? 'مبلغ قابل پرداخت' : 'مبلغ برآوردی' }}</span><span class="text-lg font-bold text-primary">{{ formatMoney(displayedTotal) }}</span></div>
    <p v-if="!preview" class="mt-2 text-xs text-text-muted">مبلغ نهایی پس از پیش‌نمایش سفارش مشخص می‌شود.</p>
    <CartCouponInput v-model="coupon" class="mt-5" :disabled="couponDisabled" :apply-disabled="disabled" :pending="pending" :applied="couponApplied" @apply="$emit('applyCoupon')" />
    <p v-if="coupon.trim() && !couponApplied" class="mt-2 text-xs text-warning">این کد هنوز در مبلغ بالا اعمال نشده است.</p>
    <button type="button" class="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50" :disabled="disabled || pending || !preview" @click="$emit('continue')">{{ pending ? 'در حال بررسی سفارش…' : 'ثبت سفارش' }}<UIcon name="solar:arrow-left-outline" class="size-5" /></button>
    <NuxtLink to="/cart" class="mt-3 block text-center text-xs text-text-secondary hover:text-primary">بازگشت به سبد خرید</NuxtLink>
  </aside>
</template>
