<script setup lang="ts">
definePageMeta({ layout: 'payment', middleware: 'auth' })

const route = useRoute()

// TODO: Populate these values with verified gateway return data.
const preview = {
  orderId: 'b74c1809-3b3a-429e-baa5-68f307085f21',
  orderNumber: 'ORD-1790281827489071401',
  amount: '۱,۷۵۰,۰۰۰ تومان',
  errorCode: 'E-7402',
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
      <article class="overflow-hidden rounded-2xl border border-danger-border bg-card shadow-sm">
        <div class="h-1 bg-danger" />
        <div class="p-6 text-center sm:p-10">
          <span class="mx-auto grid size-16 place-items-center rounded-full bg-danger-subtle text-danger">
            <UIcon name="solar:danger-circle-bold" class="size-9" aria-hidden="true" />
          </span>
          <p class="mt-5 text-sm font-semibold text-danger">پرداخت ناموفق بود</p>
          <h1 class="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">پرداخت سفارش تکمیل نشد</h1>
          <p class="mx-auto mt-3 max-w-lg text-sm leading-7 text-text-secondary">تراکنش از سوی بانک یا درگاه پرداخت تکمیل نشد. سفارش شما حفظ شده است و جزئیات آن در حساب کاربری شما در دسترس است.</p>

          <section aria-label="خلاصه سفارش" class="mt-8 rounded-2xl bg-surface p-5 text-right">
            <dl class="space-y-4 text-sm">
              <div class="flex items-center justify-between gap-4 border-b border-divider pb-4">
                <dt class="text-text-secondary">شماره سفارش</dt>
                <dd class="font-bold text-text-primary"><bdi>{{ preview.orderNumber }}</bdi></dd>
              </div>
              <div class="flex items-center justify-between gap-4 border-b border-divider pb-4">
                <dt class="text-text-secondary">مبلغ سفارش</dt>
                <dd class="font-bold text-text-primary"><bdi>{{ preview.amount }}</bdi></dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-text-secondary">کد خطا</dt>
                <dd class="font-semibold text-danger"><bdi>{{ preview.errorCode }}</bdi></dd>
              </div>
            </dl>
          </section>

          <NuxtLink :to="orderPath" class="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover sm:w-auto">
            مشاهده جزئیات سفارش
            <UIcon name="solar:arrow-left-outline" class="size-5" aria-hidden="true" />
          </NuxtLink>
          <p class="mt-4 text-xs leading-6 text-text-secondary">برای پرداخت دوباره، پس از اتصال درگاه پرداخت از صفحه سفارش اقدام کنید.</p>
        </div>
      </article>
    </div>
  </div>
</template>
