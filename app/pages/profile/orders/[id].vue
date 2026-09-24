<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const orders = useOrderStore()
const id = computed(() => String(route.params.id))
const order = computed(() => orders.current?.id === id.value ? orders.current : null)

function loadOrder() {
  void orders.fetchOne(id.value).catch(() => {})
}

watch(id, loadOrder, { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
    <NuxtLink to="/profile" class="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><UIcon name="solar:arrow-right-outline" class="size-4" />بازگشت به حساب کاربری</NuxtLink>
    <p v-if="orders.detailLoading" role="status" class="mt-8 rounded-2xl border border-border bg-card p-8 text-center text-text-secondary">در حال دریافت سفارش…</p>
    <p v-else-if="orders.detailError" role="alert" class="mt-8 rounded-xl border border-danger-border p-4 text-sm text-danger">{{ orders.detailError }} <button type="button" class="underline" @click="loadOrder">تلاش دوباره</button></p>
    <template v-else-if="order">
      <header class="mt-6 rounded-2xl border border-border bg-card p-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div><h1 class="text-xl font-bold text-text-primary">سفارش <bdi>{{ order.order_number }}</bdi></h1><p class="mt-2 text-sm text-text-secondary">ثبت‌شده در {{ orderDate(order.created_at) }}</p></div>
          <span class="rounded-full bg-primary-subtle px-3 py-1 text-sm font-medium text-primary">{{ orderStatusLabel(order.status) }}</span>
        </div>
        <p class="mt-4 text-sm text-text-secondary">روش تحویل: <span class="text-text-primary">{{ order.shipping_method_name }}</span></p>
      </header>
      <section aria-labelledby="items-title" class="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 id="items-title" class="text-lg font-bold text-text-primary">کالاهای سفارش</h2>
        <ul class="mt-4 divide-y divide-divider">
          <li v-for="item in order.items" :key="item.id" class="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
            <div><p class="font-semibold text-text-primary">{{ item.product_name }}</p><p class="mt-1 text-text-secondary">شناسه کالا: <bdi>{{ item.sku }}</bdi> · تعداد: {{ item.quantity }}</p></div>
            <span class="font-semibold text-text-primary">{{ formatMoney(item.total_amount) }}</span>
          </li>
        </ul>
      </section>
      <section aria-labelledby="total-title" class="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 id="total-title" class="text-lg font-bold text-text-primary">خلاصه هزینه</h2>
        <dl class="mt-4 space-y-3 text-sm">
          <div class="flex justify-between gap-4"><dt class="text-text-secondary">جمع کالاها</dt><dd>{{ formatMoney(order.subtotal) }}</dd></div>
          <div class="flex justify-between gap-4"><dt class="text-text-secondary">تخفیف</dt><dd>{{ formatMoney(order.discount_amount) }}</dd></div>
          <div class="flex justify-between gap-4"><dt class="text-text-secondary">هزینه ارسال</dt><dd>{{ formatMoney(order.shipping_amount) }}</dd></div>
          <div class="flex justify-between gap-4"><dt class="text-text-secondary">مالیات</dt><dd>{{ formatMoney(order.tax_amount) }}</dd></div>
          <div class="flex justify-between gap-4 border-t border-divider pt-3 font-bold text-text-primary"><dt>مبلغ نهایی</dt><dd>{{ formatMoney(order.total_amount) }}</dd></div>
        </dl>
      </section>
    </template>
  </div>
</template>
