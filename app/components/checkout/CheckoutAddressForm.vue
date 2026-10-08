<script setup lang="ts">
const draft = defineModel<AddressInput>({ required: true })
const saveToAccount = defineModel<boolean>('saveToAccount', { required: true })
const props = defineProps<{
  pickup: boolean
  requirements: ShippingAddressRequirements
  provinces: ShippingProvince[]
  errors: Partial<Record<keyof AddressInput, string>>
  pending?: boolean
  selectedAddress?: Address | null
  open?: boolean
  addressLimitError?: string
}>()
const emit = defineEmits<{ chooseAddress: []; changeAddress: []; submit: []; newAddress: [] }>()
const fieldId = useId()
const required = computed(() => ({ ...props.requirements, first_name: !!(props.requirements.first_name || props.requirements.recipient_name), last_name: !!(props.requirements.last_name || props.requirements.recipient_name) }))
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
    <template v-if="!pickup && !open">
      <div class="flex items-center gap-2"><UIcon name="solar:map-point-outline" class="size-6 text-primary" /><h2 class="text-lg font-bold text-text-primary">انتخاب نشانی تحویل</h2></div>
      <p class="mt-2 text-sm leading-7 text-text-secondary">برای ادامه، یک نشانی ذخیره‌شده را انتخاب کنید یا نشانی جدیدی وارد کنید.</p>
      <div class="mt-5 grid gap-3 sm:grid-cols-2">
        <button type="button" class="relative rounded-xl border border-border bg-card p-4 text-start transition-colors hover:border-border-strong" @click="emit('chooseAddress')">
          <span class="grid size-10 place-items-center rounded-xl bg-surface text-primary"><UIcon name="solar:map-point-outline" class="size-6" /></span>
          <span class="mt-3 block text-sm font-semibold text-text-primary">انتخاب از آدرس‌های ذخیره‌شده</span>
          <span class="mt-2 block text-xs text-text-secondary">اطلاعات نشانی قبلی را بررسی یا ویرایش کنید.</span>
        </button>
        <button type="button" :disabled="!!addressLimitError" :aria-describedby="addressLimitError ? `${fieldId}-limit` : undefined" class="relative rounded-xl border border-border bg-card p-4 text-start transition-colors enabled:hover:border-border-strong disabled:cursor-not-allowed disabled:bg-disabled-bg" @click="emit('newAddress')">
          <span class="grid size-10 place-items-center rounded-xl bg-surface text-primary"><UIcon name="solar:add-circle-outline" class="size-6" /></span>
          <span class="mt-3 block text-sm font-semibold text-text-primary">نشانی جدید</span>
          <span class="mt-2 block text-xs text-text-secondary">نشانی و اطلاعات تحویل‌گیرنده را وارد کنید.</span>
          <span v-if="addressLimitError" :id="`${fieldId}-limit`" role="alert" class="mt-2 block text-sm leading-7 text-danger">{{ addressLimitError }}</span>
        </button>
      </div>
    </template>
    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-lg font-bold text-text-primary">{{ pickup ? 'اطلاعات تحویل‌گیرنده حضوری' : 'مشخصات تحویل‌گیرنده و نشانی' }}</h2>
        <div class="flex flex-wrap items-center gap-4 text-sm font-semibold text-primary">
          <button type="button" :aria-describedby="!pickup && addressLimitError ? `${fieldId}-limit` : undefined" @click="emit('newAddress')">{{ pickup ? 'اطلاعات تحویل‌گیرنده جدید' : 'افزودن نشانی جدید' }}</button>
          <button type="button" @click="emit('changeAddress')">{{ pickup ? 'انتخاب اطلاعات ذخیره‌شده' : 'انتخاب از نشانی‌های ذخیره‌شده' }}</button>
        </div>
        <p v-if="!pickup && addressLimitError" :id="`${fieldId}-limit`" role="alert" class="text-sm leading-7 text-danger">{{ addressLimitError }}</p>
      </div>
      <p v-if="pickup" class="mt-2 text-sm text-text-secondary">برای تحویل حضوری اطلاعات خواسته‌شده را وارد کنید.</p>
      <p v-else-if="selectedAddress" class="mt-2 text-xs text-text-secondary">اطلاعات نشانی انتخاب‌شده را بررسی و فیلدهای لازم را تکمیل کنید.</p>
      <form class="mt-5 space-y-4" novalidate @submit.prevent="emit('submit')">
        <div v-if="required.first_name || required.last_name || required.phone" class="grid gap-4 sm:grid-cols-2">
          <UiInput v-if="required.first_name" v-model="draft.first_name" :error="errors.first_name" label="نام تحویل‌گیرنده *" placeholder="نام" />
          <UiInput v-if="required.last_name" v-model="draft.last_name" :error="errors.last_name" label="نام خانوادگی تحویل‌گیرنده *" placeholder="نام خانوادگی" />
          <UiInput v-if="required.phone" v-model="draft.phone" :error="errors.phone" label="شماره موبایل *" inputmode="tel" placeholder="۰۹۱۲۳۴۵۶۷۸۹" />
        </div>
        <div v-if="required.province_code || required.city_code" class="grid gap-4 sm:grid-cols-2">
          <div v-if="required.province_code || required.city_code" class="flex min-w-0 flex-col gap-2 text-sm text-text-secondary">
            <span :id="`${fieldId}-province`" class="font-medium text-text-primary">استان *</span>
            <USelect :aria-labelledby="`${fieldId}-province`" :aria-invalid="!!errors.province_code" :model-value="draft.province_code || undefined" :items="provinceItems" placeholder="انتخاب استان" :content="{ collisionPadding: 12 }" :ui="selectUi" @update:model-value="changeProvince" />
            <span v-if="errors.province_code" class="text-xs text-danger">{{ errors.province_code }}</span>
          </div>
          <div v-if="required.city_code" class="flex min-w-0 flex-col gap-2 text-sm text-text-secondary">
            <span :id="`${fieldId}-city`" class="font-medium text-text-primary">شهر *</span>
            <USelect :aria-labelledby="`${fieldId}-city`" :aria-invalid="!!errors.city_code" :model-value="draft.city_code || undefined" :items="cityItems" :placeholder="draft.province_code ? 'انتخاب شهر' : 'ابتدا استان را انتخاب کنید'" :disabled="!draft.province_code" :content="{ collisionPadding: 12 }" :ui="selectUi" @update:model-value="draft.city_code = $event ?? 0" />
            <span v-if="errors.city_code" class="text-xs text-danger">{{ errors.city_code }}</span>
          </div>
        </div>
        <UiTextarea v-if="required.address" v-model="draft.address" :error="errors.address" label="نشانی دقیق *" :rows="3" placeholder="خیابان، کوچه، پلاک و واحد" />
        <div v-if="required.postal_code" class="sm:max-w-xs"><UiInput v-model="draft.postal_code" :error="errors.postal_code" label="کد پستی *" inputmode="numeric" placeholder="کد پستی ۱۰ رقمی" /></div>
        <div class="flex flex-wrap items-center gap-4">
          <button type="submit" :disabled="pending" class="rounded-xl bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground hover:bg-secondary-hover disabled:opacity-50">{{ pending ? 'در حال بررسی…' : 'تأیید اطلاعات تحویل' }}</button>
          <div v-if="!pickup" class="flex items-center gap-2">
            <UiSwitch :id="`${fieldId}-save-switch`" v-model="saveToAccount" role="switch" :aria-checked="saveToAccount" :aria-labelledby="`${fieldId}-save`" :disabled="pending" />
            <label :id="`${fieldId}-save`" :for="`${fieldId}-save-switch`" class="cursor-pointer text-sm text-text-secondary">ذخیره نشانی در حساب کاربری</label>
          </div>
        </div>
      </form>
    </template>
  </section>
</template>
