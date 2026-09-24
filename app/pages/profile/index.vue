<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()
const addresses = useAddressStore()
const locations = useShippingLocationsStore()
const orders = useOrderStore()
const toast = useAppToast()
const editingId = ref<string | null>(null)
const formOpen = ref(false)
const draft = ref<AddressInput>(emptyDraft())
const errors = ref<Partial<Record<keyof AddressInput, string>>>({})

function emptyDraft(): AddressInput {
  return { name: '', phone: '', province_code: 0, city_code: 0, postal_code: '', address: '' }
}

function normalizeDigits(value: string) {
  return value.replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x0660))
}

function validate(): AddressInput | null {
  const input: AddressInput = {
    name: draft.value.name.trim(), phone: normalizeDigits(draft.value.phone.trim()).replace(/^(?:\+98|0098)/, '0'),
    province_code: draft.value.province_code, city_code: draft.value.city_code,
    postal_code: normalizeDigits(draft.value.postal_code.trim()), address: draft.value.address.trim(),
  }
  const next: typeof errors.value = {}
  if (!input.name) next.name = 'نام تحویل‌گیرنده را وارد کنید.'
  if (!/^(?:\+98|0098|0)?9\d{9}$/.test(input.phone)) next.phone = 'شماره موبایل معتبر وارد کنید.'
  const province = locations.provinces.find(item => item.code === input.province_code)
  if (!province) next.province_code = 'استان را انتخاب کنید.'
  if (!province?.cities.some(item => item.code === input.city_code)) next.city_code = 'شهر را انتخاب کنید.'
  if (!input.address) next.address = 'نشانی دقیق را وارد کنید.'
  if (!/^\d{10}$/.test(input.postal_code)) next.postal_code = 'کد پستی باید ۱۰ رقم باشد.'
  errors.value = next
  return Object.keys(next).length ? null : input
}

function addAddress() {
  editingId.value = null
  draft.value = emptyDraft()
  errors.value = {}
  formOpen.value = true
}

function editAddress(address: Address) {
  editingId.value = address.id
  draft.value = {
    name: address.name, phone: address.phone_number,
    province_code: address.province_code, city_code: address.city_code,
    postal_code: address.postal_code, address: address.address,
  }
  errors.value = {}
  formOpen.value = true
}

async function saveAddress() {
  if (addresses.mutating || addresses.loading || !locations.loaded) return
  const input = validate()
  if (!input) return
  try {
    if (editingId.value) await addresses.update(editingId.value, input)
    else await addresses.create(input)
    toast.success(editingId.value ? 'نشانی ویرایش شد.' : 'نشانی افزوده شد.')
    formOpen.value = false
    editingId.value = null
  } catch (cause) {
    toast.error(cause instanceof ApiError ? cause.message : 'ذخیره نشانی ناموفق بود.')
  }
}

async function removeAddress(address: Address) {
  if (addresses.mutating || addresses.loading || !(await useConfirm(`نشانی ${address.name} حذف شود؟`, { title: 'حذف نشانی', confirmLabel: 'حذف', variant: 'danger' }))) return
  try {
    await addresses.remove(address.id)
    if (editingId.value === address.id) formOpen.value = false
    toast.success('نشانی حذف شد.')
  } catch (cause) {
    toast.error(cause instanceof ApiError ? cause.message : 'حذف نشانی ناموفق بود.')
  }
}

onMounted(() => {
  void addresses.fetchAll().catch(() => {})
  void locations.fetchAll().catch(() => {})
  void orders.fetchAll().catch(() => {})
})
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
    <header class="mb-6 rounded-2xl bg-primary-subtle p-6 sm:p-8">
      <div class="flex items-center gap-3"><span class="grid size-12 place-items-center rounded-full bg-card text-primary"><UIcon name="solar:user-outline" class="size-7" /></span><div><h1 class="text-2xl font-bold text-text-primary">حساب کاربری</h1><p class="mt-1 text-sm text-text-secondary">{{ auth.user?.name || auth.user?.phone || 'خوش آمدید' }}</p></div></div>
    </header>

    <nav aria-label="میانبرهای حساب کاربری" class="mb-8 grid gap-4 sm:grid-cols-2">
      <NuxtLink to="/cart" class="flex items-center justify-between rounded-2xl border border-border bg-card p-5 text-text-primary hover:border-primary"><span class="flex items-center gap-3 font-semibold"><UIcon name="solar:cart-4-outline" class="size-6 text-primary" />سبد خرید</span><UIcon name="solar:arrow-left-outline" class="size-5" /></NuxtLink>
      <NuxtLink to="/wishlist" class="flex items-center justify-between rounded-2xl border border-border bg-card p-5 text-text-primary hover:border-primary"><span class="flex items-center gap-3 font-semibold"><UIcon name="solar:heart-outline" class="size-6 text-primary" />علاقه‌مندی‌ها</span><UIcon name="solar:arrow-left-outline" class="size-5" /></NuxtLink>
    </nav>

    <section aria-labelledby="addresses-title" class="space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3"><div><h2 id="addresses-title" class="text-xl font-bold text-text-primary">نشانی‌های من</h2><p class="mt-1 text-sm text-text-secondary">نشانی‌های تحویل خود را مدیریت کنید.</p></div><button type="button" :disabled="addresses.loading || locations.loading || !locations.loaded" class="rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground hover:bg-secondary-hover disabled:opacity-50" @click="addAddress">افزودن نشانی</button></div>
      <p v-if="addresses.error" role="alert" class="rounded-xl border border-danger-border p-4 text-sm text-danger">{{ addresses.error }} <button type="button" class="underline" :disabled="addresses.loading" @click="addresses.fetchAll().catch(() => {})">تلاش دوباره</button></p>
      <p v-if="locations.error" role="alert" class="rounded-xl border border-danger-border p-4 text-sm text-danger">{{ locations.error }} <button type="button" class="underline" :disabled="locations.loading" @click="locations.fetchAll().catch(() => {})">تلاش دوباره</button></p>
      <p v-if="addresses.loading && !addresses.loaded" role="status" class="p-8 text-center text-text-secondary">در حال دریافت نشانی‌ها…</p>
      <ProfileAddressList v-else-if="addresses.items.length" :addresses="addresses.items" :provinces="locations.provinces" :disabled="addresses.mutating || addresses.loading || !locations.loaded" @edit="editAddress" @remove="removeAddress" />
      <div v-else-if="addresses.loaded && !addresses.error" class="rounded-2xl border border-dashed border-border-strong bg-card p-8 text-center text-text-secondary">هنوز نشانی ثبت نکرده‌اید.</div>
      <ProfileAddressForm v-if="formOpen" v-model="draft" :provinces="locations.provinces" :errors="errors" :pending="addresses.mutating || addresses.loading" :editing="!!editingId" @submit="saveAddress" @cancel="formOpen = false" />
    </section>

    <section aria-labelledby="orders-title" class="mt-10 space-y-5">
      <div><h2 id="orders-title" class="text-xl font-bold text-text-primary">سفارش‌های من</h2><p class="mt-1 text-sm text-text-secondary">سفارش‌های ثبت‌شده و وضعیت آن‌ها را ببینید.</p></div>
      <p v-if="orders.error" role="alert" class="rounded-xl border border-danger-border p-4 text-sm text-danger">{{ orders.error }} <button type="button" class="underline" :disabled="orders.loading" @click="orders.fetchAll(orders.page).catch(() => {})">تلاش دوباره</button></p>
      <p v-if="orders.loading && !orders.loaded" role="status" class="p-8 text-center text-text-secondary">در حال دریافت سفارش‌ها…</p>
      <ProfileOrderList v-else-if="orders.items.length" :orders="orders.items" />
      <div v-else-if="orders.loaded && !orders.error" class="rounded-2xl border border-dashed border-border-strong bg-card p-8 text-center text-text-secondary">هنوز سفارشی ثبت نکرده‌اید.</div>
      <nav v-if="orders.total > orders.limit" aria-label="صفحه‌های سفارش" class="flex items-center justify-center gap-4 text-sm">
        <button type="button" class="rounded-xl border border-border px-4 py-2 text-text-primary disabled:opacity-50" :disabled="orders.loading || orders.page <= 1" @click="orders.fetchAll(orders.page - 1).catch(() => {})">صفحه قبل</button>
        <span class="text-text-secondary">صفحه {{ orders.page }} از {{ Math.ceil(orders.total / orders.limit) }}</span>
        <button type="button" class="rounded-xl border border-border px-4 py-2 text-text-primary disabled:opacity-50" :disabled="orders.loading || orders.page >= Math.ceil(orders.total / orders.limit)" @click="orders.fetchAll(orders.page + 1).catch(() => {})">صفحه بعد</button>
      </nav>
    </section>
  </div>
</template>
