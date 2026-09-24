<script setup lang="ts">
const methodId = defineModel<string>({ required: true })
defineProps<{ methods: ShippingMethod[]; loading?: boolean }>()

const labels: Record<string, { title: string; icon: string }> = {
  bike_courier: { title: 'پیک موتوری', icon: 'solar:delivery-outline' },
  local_pickup: { title: 'تحویل حضوری', icon: 'solar:shop-2-outline' },
  tapin_post: { title: 'پست', icon: 'solar:box-outline' },
}

function fee(method: ShippingMethod) {
  if (method.price_strategy === 'free') return 'رایگان'
  if (method.price_strategy === 'fixed') return formatMoney(method.fixed_price)
  return 'پس از محاسبه نشانی'
}
</script>

<template>
  <section class="rounded-2xl border border-border bg-card p-5 sm:p-6">
    <div class="flex items-center gap-2"><UIcon name="solar:delivery-outline" class="size-6 text-primary" /><h1 class="text-lg font-bold text-text-primary">انتخاب شیوه تحویل سفارش</h1></div>
    <p class="mt-2 text-sm leading-7 text-text-secondary">هزینه نهایی پس از انتخاب نشانی محاسبه می‌شود.</p>
    <p v-if="loading" role="status" class="mt-5 text-sm text-text-secondary">در حال دریافت روش‌های ارسال…</p>
    <div v-else class="mt-5 grid gap-3 md:grid-cols-3">
      <button v-for="option in methods" :key="option.id" type="button" class="relative rounded-xl border p-4 text-start transition-colors" :class="methodId === option.id ? 'border-primary bg-primary-subtle ring-1 ring-primary' : 'border-border bg-card hover:border-border-strong'" :aria-pressed="methodId === option.id" @click="methodId = option.id">
        <span v-if="methodId === option.id" class="absolute top-3 inset-e-3 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground"><UIcon name="solar:check-circle-bold" class="size-4" /></span>
        <span class="grid size-10 place-items-center rounded-xl bg-surface text-primary"><UIcon :name="labels[option.code]?.icon ?? 'solar:delivery-outline'" class="size-6" /></span>
        <span class="mt-3 block text-sm font-semibold text-text-primary">{{ labels[option.code]?.title ?? option.name }}</span>
        <span class="mt-3 block text-xs text-text-secondary">هزینه ارسال: <strong class="text-primary">{{ fee(option) }}</strong></span>
      </button>
    </div>
    <p v-if="!loading && !methods.length" class="mt-4 text-sm text-text-secondary">در حال حاضر روش ارسالی در دسترس نیست.</p>
  </section>
</template>
