<script setup lang="ts">
definePageMeta({ layout: 'payment', middleware: 'auth' })

const route = useRoute()

// TODO: Populate these values with verified gateway return data.
const preview = {
  orderId: 'b74c1809-3b3a-429e-baa5-68f307085f21',
  orderNumber: 'ORD-1790281827489071401',
  amount: '۱,۷۵۰,۰۰۰ تومان',
  trackingCode: '۷۸۳۴۹۳۵۶۱',
}

const orderId = computed(() => {
  const value = route.query.id ?? route.query.order_id
  return typeof value === 'string' && value.trim() ? value.trim() : preview.orderId
})
const orderPath = computed(() => `/profile/orders/${encodeURIComponent(orderId.value)}`)
</script>

<template>
  <div class="bg-surface">
    <CartCheckoutStepper :step="3" />
    <div class="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <article class="overflow-hidden rounded-2xl border border-success-border bg-card shadow-sm">
        <div class="h-1 bg-success" />
        <div class="p-6 text-center sm:p-10">
          <span class="mx-auto grid size-16 place-items-center rounded-full bg-success-subtle text-success">
            <UIcon name="solar:check-circle-bold" class="size-9" aria-hidden="true" />
          </span>
          <p class="mt-5 text-sm font-semibold text-success">پرداخت با موفقیت انجام شد</p>
          <h1 class="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">سفارش شما ثبت شد</h1>
          <p class="mx-auto mt-3 max-w-lg text-sm leading-7 text-text-secondary">پرداخت شما با موفقیت تایید شد. سفارش شما در حال آماده‌سازی است و می‌توانید وضعیت آن را از حساب کاربری پیگیری کنید.</p>

          <section aria-label="خلاصه پرداخت" class="mt-8 rounded-2xl bg-surface p-5 text-right">
            <dl class="space-y-4 text-sm">
              <div class="flex items-center justify-between gap-4 border-b border-divider pb-4">
                <dt class="text-text-secondary">شماره سفارش</dt>
                <dd class="font-bold text-text-primary"><bdi>{{ preview.orderNumber }}</bdi></dd>
              </div>
              <div class="flex items-center justify-between gap-4 border-b border-divider pb-4">
                <dt class="text-text-secondary">مبلغ پرداخت‌شده</dt>
                <dd class="font-bold text-text-primary"><bdi>{{ preview.amount }}</bdi></dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-text-secondary">کد پیگیری پرداخت</dt>
                <dd class="font-semibold text-text-primary"><bdi>{{ preview.trackingCode }}</bdi></dd>
              </div>
            </dl>
          </section>

          <NuxtLink :to="orderPath" class="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover sm:w-auto">
            مشاهده جزئیات سفارش
            <UIcon name="solar:arrow-left-outline" class="size-5" aria-hidden="true" />
          </NuxtLink>
          <NuxtLink to="/" class="mt-4 block text-sm font-semibold text-primary hover:underline">بازگشت به فروشگاه</NuxtLink>
        </div>
      </article>
    </div>
  </div>
</template>
