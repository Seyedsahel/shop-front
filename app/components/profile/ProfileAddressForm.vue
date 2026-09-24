<script setup lang="ts">
const draft = defineModel<AddressInput>({ required: true })
const props = defineProps<{
  provinces: ShippingProvince[]
  errors: Partial<Record<keyof AddressInput, string>>
  pending?: boolean
  editing?: boolean
}>()
const emit = defineEmits<{ submit: []; cancel: [] }>()
const fieldId = useId()

const cities = computed(() => props.provinces.find(item => item.code === draft.value.province_code)?.cities ?? [])
const provinceItems = computed(() => props.provinces.map(province => ({ label: province.title.trim(), value: province.code })))
const cityItems = computed(() => cities.value.map(city => ({ label: city.title.trim(), value: city.code })))
const selectUi = {
  base: 'w-full min-h-12 rounded-xl border border-border-strong bg-card ps-4 pe-12 py-3 text-sm text-text-primary shadow-none focus-visible:outline-2 focus-visible:outline-focus-ring disabled:bg-disabled-bg',
  trailing: 'end-3',
  trailingIcon: 'size-4 text-text-muted',
  content: 'z-50 flex max-h-[min(20rem,calc(100dvh-1.5rem))] w-[var(--reka-select-trigger-width)] min-w-[var(--reka-select-trigger-width)] flex-col overflow-hidden rounded-xl border border-border-strong bg-card shadow-lg',
  viewport: 'min-h-0 overflow-y-auto overscroll-contain',
  group: 'p-1',
  item: 'min-h-11 gap-2 rounded-none border-b border-divider bg-card px-3 py-3 text-text-primary last:border-b-0 data-[highlighted]:bg-primary-subtle data-[highlighted]:text-primary data-[state=checked]:bg-primary-subtle data-[disabled]:bg-disabled-bg data-[disabled]:text-disabled-text',
  itemLabel: 'whitespace-normal break-words text-start',
  itemTrailing: 'shrink-0 ps-3',
}

function changeProvince(code: number | undefined) {
  draft.value.province_code = code ?? 0
  draft.value.city_code = 0
}

function changeCity(code: number | undefined) {
  draft.value.city_code = code ?? 0
}
</script>

<template>
  <form class="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6" novalidate @submit.prevent="emit('submit')">
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-lg font-bold text-text-primary">{{ editing ? 'ویرایش نشانی' : 'افزودن نشانی' }}</h3>
      <button type="button" class="text-sm text-text-secondary hover:text-text-primary" @click="emit('cancel')">انصراف</button>
    </div>
    <div class="grid gap-4 sm:grid-cols-2">
      <UiInput v-model="draft.name" :error="errors.name" label="نام تحویل‌گیرنده *" placeholder="نام و نام خانوادگی" />
      <UiInput v-model="draft.phone" :error="errors.phone" label="شماره موبایل *" inputmode="tel" placeholder="۰۹۱۲۳۴۵۶۷۸۹" />
    </div>
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="flex min-w-0 flex-col gap-2 text-sm text-text-secondary">
        <span :id="`${fieldId}-province`" class="font-medium text-text-primary">استان *</span>
        <USelect
          :aria-labelledby="`${fieldId}-province`"
          :aria-invalid="!!errors.province_code"
          :model-value="draft.province_code || undefined"
          :items="provinceItems"
          placeholder="انتخاب استان"
          :content="{ collisionPadding: 12 }"
          :ui="selectUi"
          @update:model-value="changeProvince"
        />
        <span v-if="errors.province_code" class="text-xs text-danger">{{ errors.province_code }}</span>
      </div>
      <div class="flex min-w-0 flex-col gap-2 text-sm text-text-secondary">
        <span :id="`${fieldId}-city`" class="font-medium text-text-primary">شهر *</span>
        <USelect
          :aria-labelledby="`${fieldId}-city`"
          :aria-invalid="!!errors.city_code"
          :model-value="draft.city_code || undefined"
          :items="cityItems"
          :placeholder="draft.province_code ? 'انتخاب شهر' : 'ابتدا استان را انتخاب کنید'"
          :disabled="!draft.province_code"
          :content="{ collisionPadding: 12 }"
          :ui="selectUi"
          @update:model-value="changeCity"
        />
        <span v-if="errors.city_code" class="text-xs text-danger">{{ errors.city_code }}</span>
      </div>
    </div>
    <UiTextarea v-model="draft.address" :error="errors.address" label="نشانی دقیق *" :rows="3" placeholder="خیابان، کوچه، پلاک و واحد" />
    <div class="sm:max-w-xs"><UiInput v-model="draft.postal_code" :error="errors.postal_code" label="کد پستی *" inputmode="numeric" placeholder="کد پستی ۱۰ رقمی" /></div>
    <button type="submit" :disabled="pending" class="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50">{{ pending ? 'در حال ذخیره…' : 'ذخیره نشانی' }}</button>
  </form>
</template>
