<script setup lang="ts">
const draft = defineModel<AddressInput>({ required: true })
const props = defineProps<{
  pickup: boolean
  provinces: ShippingProvince[]
  errors: Partial<Record<keyof AddressInput, string>>
  pending?: boolean
  selectedAddress?: Address | null
}>()
const emit = defineEmits<{ chooseAddress: []; save: []; newAddress: [] }>()
const fieldId = useId()
const cities = computed(() => props.provinces.find(item => item.code === draft.value.province_code)?.cities ?? [])
const provinceItems = computed(() => props.provinces.map(item => ({ label: item.title.trim(), value: item.code })))
const cityItems = computed(() => cities.value.map(item => ({ label: item.title.trim(), value: item.code })))
const selectUi = {
  base: 'w-full min-h-12 rounded-xl border border-border-strong bg-card ps-4 pe-12 py-3 text-sm text-text-primary shadow-none focus-visible:outline-2 focus-visible:outline-focus-ring disabled:bg-disabled-bg',
  trailing: 'end-3', trailingIcon: 'size-4 text-text-muted',
  content: 'z-50 flex max-h-[min(20rem,calc(100dvh-1.5rem))] w-[var(--reka-select-trigger-width)] min-w-[var(--reka-select-trigger-width)] flex-col overflow-hidden rounded-xl border border-border-strong bg-card shadow-lg',
  viewport: 'min-h-0 overflow-y-auto overscroll-contain', group: 'p-1',
  item: 'min-h-11 gap-2 rounded-none border-b border-divider bg-card px-3 py-3 text-text-primary last:border-b-0 data-[highlighted]:bg-primary-subtle data-[highlighted]:text-primary data-[state=checked]:bg-primary-subtle',
  itemLabel: 'whitespace-normal break-words text-start', itemTrailing: 'shrink-0 ps-3',
}

function changeProvince(code: number | undefined) {
  draft.value.province_code = code ?? 0
  draft.value.city_code = 0
}
</script>

<template>
  <section class="rounded-2xl border border-border bg-card p-5 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-lg font-bold text-text-primary">{{ pickup ? 'اطلاعات تحویل‌گیرنده حضوری' : 'مشخصات تحویل‌گیرنده و نشانی' }}</h2>
      <div v-if="!pickup" class="flex gap-4 text-xs font-semibold text-primary">
        <button type="button" @click="emit('chooseAddress')">انتخاب از آدرس‌های ذخیره‌شده</button>
        <button type="button" @click="emit('newAddress')">نشانی جدید</button>
      </div>
    </div>
    <p v-if="pickup" class="mt-2 text-sm text-text-secondary">برای تحویل حضوری فقط نام و شماره تماس را وارد کنید.</p>
    <p v-else-if="selectedAddress" class="mt-2 text-xs text-text-secondary">نشانی ذخیره‌شده انتخاب شده است. پس از تغییر اطلاعات، «ذخیره نشانی» را بزنید.</p>
    <form class="mt-5 space-y-4" novalidate @submit.prevent="emit('save')">
      <div class="grid gap-4 sm:grid-cols-2">
        <UiInput v-model="draft.name" :error="errors.name" label="نام و نام خانوادگی تحویل‌گیرنده *" placeholder="نام دریافت‌کننده" />
        <UiInput v-model="draft.phone" :error="errors.phone" label="شماره موبایل *" inputmode="tel" placeholder="۰۹۱۲۳۴۵۶۷۸۹" />
      </div>
      <template v-if="!pickup">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="flex min-w-0 flex-col gap-2 text-sm text-text-secondary">
            <span :id="`${fieldId}-province`" class="font-medium text-text-primary">استان *</span>
            <USelect :aria-labelledby="`${fieldId}-province`" :aria-invalid="!!errors.province_code" :model-value="draft.province_code || undefined" :items="provinceItems" placeholder="انتخاب استان" :content="{ collisionPadding: 12 }" :ui="selectUi" @update:model-value="changeProvince" />
            <span v-if="errors.province_code" class="text-xs text-danger">{{ errors.province_code }}</span>
          </div>
          <div class="flex min-w-0 flex-col gap-2 text-sm text-text-secondary">
            <span :id="`${fieldId}-city`" class="font-medium text-text-primary">شهر *</span>
            <USelect :aria-labelledby="`${fieldId}-city`" :aria-invalid="!!errors.city_code" :model-value="draft.city_code || undefined" :items="cityItems" :placeholder="draft.province_code ? 'انتخاب شهر' : 'ابتدا استان را انتخاب کنید'" :disabled="!draft.province_code" :content="{ collisionPadding: 12 }" :ui="selectUi" @update:model-value="draft.city_code = $event ?? 0" />
            <span v-if="errors.city_code" class="text-xs text-danger">{{ errors.city_code }}</span>
          </div>
        </div>
        <UiTextarea v-model="draft.address" :error="errors.address" label="نشانی دقیق *" :rows="3" placeholder="خیابان، کوچه، پلاک و واحد" />
        <div class="sm:max-w-xs"><UiInput v-model="draft.postal_code" :error="errors.postal_code" label="کد پستی *" inputmode="numeric" placeholder="کد پستی ۱۰ رقمی" /></div>
        <button type="submit" :disabled="pending" class="rounded-xl bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground hover:bg-secondary-hover disabled:opacity-50">{{ pending ? 'در حال ذخیره…' : 'ذخیره نشانی' }}</button>
      </template>
    </form>
  </section>
</template>
