<script setup lang="ts">
const props = defineProps<{ orderId: string; order: OrderDetail | null; loading: boolean; error: string; authenticated: boolean; failureHint?: string; referenceHint?: string }>()
defineEmits<{ retry: [] }>()
const confirmed = computed(() => !!props.order && ['paid', 'processing', 'shipped', 'delivered'].includes(props.order.status))
const cancelled = computed(() => props.order?.status === 'cancelled')
const title = computed(() => confirmed.value ? 'پرداخت سفارش تأیید شد' : cancelled.value ? 'سفارش لغو شده است' : props.order?.status === 'pending_payment' ? 'پرداخت هنوز تأیید نشده است' : 'بررسی وضعیت سفارش')
const orderPath = computed(() => `/profile/orders/${encodeURIComponent(props.orderId)}`)
</script>

<template>
  <div class="bg-surface">
    <CartCheckoutStepper :step="3" />
    <div class="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <article class="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div class="h-1" :class="confirmed ? 'bg-success' : 'bg-warning'" />
        <div class="p-6 text-center sm:p-10">
          <UIcon :name="confirmed ? 'solar:check-circle-bold' : 'solar:info-circle-bold'" class="mx-auto size-16" :class="confirmed ? 'text-success' : 'text-warning'" aria-hidden="true" />
          <h1 class="mt-5 text-2xl font-bold text-text-primary">{{ title }}</h1>
          <p v-if="loading" role="status" class="mt-3 text-sm text-text-secondary">در حال دریافت وضعیت سفارش از فروشگاه…</p>
          <p v-else-if="!authenticated" class="mt-3 text-sm text-text-secondary">برای بررسی وضعیت پرداخت، وارد حساب کاربری شوید و سفارش‌های خود را باز کنید.</p>
          <p v-else-if="!orderId" role="alert" class="mt-3 text-sm text-danger">شناسه سفارش در نشانی صفحه وجود ندارد. سفارش‌های حساب کاربری را بررسی کنید.</p>
          <p v-else-if="error" role="alert" class="mt-3 text-sm text-danger">{{ error }} برای پیگیری، وارد حساب کاربری شوید و سفارش‌های خود را باز کنید. <button type="button" class="underline" @click="$emit('retry')">بررسی دوباره</button></p>
          <p v-else-if="confirmed" class="mt-3 text-sm text-text-secondary">پرداخت از سوی فروشگاه تأیید شده است. وضعیت سفارش را از حساب کاربری پیگیری کنید.</p>
          <p v-else-if="cancelled" class="mt-3 text-sm text-text-secondary">این سفارش قابل پرداخت نیست. برای خرید، سفارش جدیدی ثبت کنید.</p>
          <p v-else-if="order?.status === 'pending_payment'" class="mt-3 text-sm text-text-secondary">سفارش در انتظار پرداخت یا تأیید است. پیش از پرداخت دوباره، وضعیت سفارش را بررسی کنید.</p>
          <dl class="mt-8 space-y-4 rounded-2xl bg-surface p-5 text-sm">
            <div class="flex justify-between gap-4"><dt class="text-text-secondary">شناسه سفارش</dt><dd class="break-all font-semibold text-text-primary"><bdi>{{ orderId || 'نامشخص' }}</bdi></dd></div>
            <template v-if="order">
              <div class="flex justify-between gap-4"><dt class="text-text-secondary">شماره سفارش</dt><dd><bdi>{{ order.order_number }}</bdi></dd></div>
              <div class="flex justify-between gap-4"><dt class="text-text-secondary">مبلغ سفارش</dt><dd>{{ formatMoney(order.total_amount) }}</dd></div>
              <div class="flex justify-between gap-4"><dt class="text-text-secondary">وضعیت سفارش</dt><dd>{{ orderStatusLabel(order.status) }}</dd></div>
            </template>
            <div v-if="referenceHint" class="flex justify-between gap-4"><dt class="text-text-secondary">کد پیگیری اعلام‌شده در بازگشت درگاه</dt><dd class="break-all"><bdi>{{ referenceHint }}</bdi></dd></div>
            <div v-if="failureHint && !confirmed" class="flex justify-between gap-4"><dt class="text-text-secondary">پیام اعلام‌شده در بازگشت درگاه</dt><dd class="break-all"><bdi>{{ failureHint }}</bdi></dd></div>
          </dl>
          <NuxtLink :to="orderId ? orderPath : '/profile'" class="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">{{ authenticated && orderId ? 'مشاهده جزئیات سفارش' : 'ورود و مشاهده سفارش‌ها' }}</NuxtLink>
          <NuxtLink v-if="order?.status === 'pending_payment'" :to="orderPath" class="mt-4 block text-sm font-semibold text-primary">ادامه پرداخت همین سفارش</NuxtLink>
          <NuxtLink v-if="cancelled" to="/checkout" class="mt-4 block text-sm font-semibold text-primary">شروع سفارش جدید</NuxtLink>
          <NuxtLink to="/" class="mt-4 block text-sm font-semibold text-primary">بازگشت به فروشگاه</NuxtLink>
        </div>
      </article>
    </div>
  </div>
</template>
