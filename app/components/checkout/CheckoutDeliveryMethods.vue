<script setup lang="ts">
const method = defineModel<DeliveryMethod>({ required: true })

const methods: { id: DeliveryMethod; title: string; description: string; fee: number; icon: string; badge?: string }[] = [
  { id: 'courier', title: 'پیک موتوری فوری', description: 'تحویل امروز در بازه زمانی انتخابی، ویژه شهر تهران', fee: 45000, icon: 'solar:delivery-outline', badge: 'پیشنهادی' },
  { id: 'pickup', title: 'تحویل حضوری', description: 'دریافت سفارش از فروشگاه، آماده تا ۲ ساعت', fee: 0, icon: 'solar:shop-2-outline', badge: 'رایگان' },
  { id: 'post', title: 'پست پیشتاز کشوری', description: 'ارسال امن به تمام نقاط کشور در ۲ تا ۴ روز کاری', fee: 35000, icon: 'solar:box-outline' },
]
</script>

<template>
  <section class="rounded-2xl border border-border bg-card p-5 sm:p-6">
    <div class="flex items-center gap-2"><UIcon name="solar:delivery-outline" class="size-6 text-primary" /><h1 class="text-lg font-bold text-text-primary">انتخاب شیوه تحویل سفارش</h1></div>
    <p class="mt-2 text-sm leading-7 text-text-secondary">روش مناسب دریافت سفارش را انتخاب کنید؛ اطلاعات و هزینه ارسال با انتخاب شما به‌روزرسانی می‌شود.</p>
    <!-- TODO: Replace delivery options, availability, slots, and fees with Delivery API. -->
    <div class="mt-5 grid gap-3 md:grid-cols-3">
      <button v-for="option in methods" :key="option.id" type="button" class="relative rounded-xl border p-4 text-start transition-colors" :class="method === option.id ? 'border-primary bg-primary-subtle ring-1 ring-primary' : 'border-border bg-card hover:border-border-strong'" @click="method = option.id">
        <span v-if="method === option.id" class="absolute top-3 inset-e-3 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground"><UIcon name="solar:check-circle-bold" class="size-4" /></span>
        <span class="grid size-10 place-items-center rounded-xl bg-surface text-primary"><UIcon :name="option.icon" class="size-6" /></span>
        <span class="mt-3 flex items-center gap-2 text-sm font-semibold text-text-primary">{{ option.title }}<UiBadge v-if="option.badge" variant="stock">{{ option.badge }}</UiBadge></span>
        <span class="mt-2 block min-h-12 text-xs leading-6 text-text-secondary">{{ option.description }}</span>
        <span class="mt-3 block text-xs font-semibold text-text-primary">هزینه ارسال: <strong class="text-primary">{{ option.fee ? `${option.fee.toLocaleString('fa-IR')} تومان` : 'رایگان' }}</strong></span>
      </button>
    </div>
  </section>
</template>
