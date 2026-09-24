<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const cart = useCartStore()
const addresses = useAddressStore()
const locations = useShippingLocationsStore()
const checkout = useCheckoutStore()
const toast = useAppToast()
const selectedAddressId = ref<string | null>(null)
const selectedMethodId = ref('')
const addressSheetOpen = ref(false)
const editingId = ref<string | null>(null)
const draft = ref<AddressInput>(emptyDraft())
const errors = ref<Partial<Record<keyof AddressInput, string>>>({})
const previewError = ref('')
const loadError = ref('')

function emptyDraft(): AddressInput {
  return { name: '', phone: '', province_code: 0, city_code: 0, postal_code: '', address: '' }
}

function normalizeDigits(value: string) {
  return value.replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x0660))
}

function validateAddress(): AddressInput | null {
  const input: AddressInput = {
    name: draft.value.name.trim(),
    phone: normalizeDigits(draft.value.phone.trim()).replace(/^(?:\+98|0098)/, '0'),
    province_code: draft.value.province_code,
    city_code: draft.value.city_code,
    postal_code: normalizeDigits(draft.value.postal_code.trim()),
    address: draft.value.address.trim(),
  }
  const next: typeof errors.value = {}
  if (!input.name) next.name = 'نام تحویل‌گیرنده را وارد کنید.'
  if (!/^09\d{9}$/.test(input.phone)) next.phone = 'شماره موبایل معتبر وارد کنید.'
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
  selectedAddressId.value = null
  draft.value = emptyDraft()
  errors.value = {}
  addressSheetOpen.value = false
}

function selectAddress(address: Address) {
  editingId.value = address.id
  selectedAddressId.value = address.id
  draft.value = {
    name: address.name, phone: address.phone_number,
    province_code: address.province_code, city_code: address.city_code,
    postal_code: address.postal_code, address: address.address,
  }
  errors.value = {}
  addressSheetOpen.value = false
}

async function saveAddress() {
  if (addresses.mutating || !locations.loaded) return
  const input = validateAddress()
  if (!input) return
  try {
    const address = editingId.value
      ? await addresses.update(editingId.value, input)
      : await addresses.create(input)
    selectedAddressId.value = address.id
    editingId.value = address.id
    selectAddress(address)
    toast.success('نشانی ذخیره شد.')
  } catch (cause) {
    toast.error(cause instanceof ApiError ? cause.message : 'ذخیره نشانی ناموفق بود.')
  }
}

const selectedMethod = computed(() => checkout.methods.find(item => item.id === selectedMethodId.value))
const pickup = computed(() => selectedMethod.value?.code === 'local_pickup')
const selectedAddress = computed(() => addresses.items.find(item => item.id === selectedAddressId.value) ?? null)
const addressSaved = computed(() => {
  const address = selectedAddress.value
  return !!address && draft.value.name === address.name && draft.value.phone === address.phone_number
    && draft.value.province_code === address.province_code && draft.value.city_code === address.city_code
    && draft.value.postal_code === address.postal_code && draft.value.address === address.address
})
const addressReady = computed(() => {
  const address = selectedAddress.value
  const requirements = selectedMethod.value?.address_requirements
  if (!address || !requirements) return false
  return (!requirements.recipient_name || !!address.name.trim())
    && (!requirements.phone || !!address.phone_number.trim())
    && (!requirements.province_code || address.province_code > 0)
    && (!requirements.city_code || address.city_code > 0)
    && (!requirements.address || !!address.address.trim())
    && (!requirements.postal_code || /^\d{10}$/.test(normalizeDigits(address.postal_code)))
})
const methodNames: Record<string, string> = { bike_courier: 'پیک موتوری', local_pickup: 'تحویل حضوری', tapin_post: 'پست' }
const methodName = computed(() => methodNames[selectedMethod.value?.code ?? ''] ?? selectedMethod.value?.name ?? '')
const currentInput = computed<CheckoutInput | null>(() => {
  if (!cart.cart?.id || !selectedMethod.value) return null
  if (pickup.value) {
    const phone = normalizeDigits(draft.value.phone.trim()).replace(/^(?:\+98|0098)/, '0')
    if (!draft.value.name.trim() || !/^09\d{9}$/.test(phone)) return null
  } else if (!addressSaved.value || !addressReady.value || !selectedAddressId.value) return null
  return {
    cart_id: cart.cart.id,
    ...(!pickup.value && selectedAddressId.value ? { address_id: selectedAddressId.value } : {}),
    shipping_method_id: selectedMethodId.value,
    recipient_name: draft.value.name.trim(),
    phone: normalizeDigits(draft.value.phone.trim()).replace(/^(?:\+98|0098)/, '0'),
    ...(!pickup.value && selectedAddress.value ? {
      province_code: selectedAddress.value.province_code,
      city_code: selectedAddress.value.city_code,
      address: selectedAddress.value.address,
      postal_code: selectedAddress.value.postal_code,
    } : {}),
    ...(checkout.couponCode ? { coupon_code: checkout.couponCode } : {}),
  }
})

async function refreshPreview() {
  checkout.clearPreview()
  previewError.value = ''
  const input = currentInput.value
  if (!input || cart.stale || checkout.order) return
  try {
    await checkout.fetchPreview(input)
  } catch (cause) {
    previewError.value = cause instanceof ApiError ? cause.message : 'محاسبه سفارش ناموفق بود.'
  }
}

async function applyCoupon(): Promise<boolean> {
  if (checkout.previewing || checkout.submitting) return false
  const input = currentInput.value
  if (!input) {
    toast.error('ابتدا روش تحویل و نشانی معتبر را انتخاب کنید.')
    return false
  }
  const candidate = checkout.couponDraft.trim()
  const { coupon_code: _previous, ...base } = input
  previewError.value = ''
  try {
    const result = await checkout.fetchPreview(candidate ? { ...base, coupon_code: candidate } : base)
    if (!result) return false
    checkout.couponCode = candidate
    toast.success(candidate ? 'کد تخفیف با پیش‌نمایش بررسی شد.' : 'کد تخفیف حذف شد.')
    return true
  } catch (cause) {
    previewError.value = cause instanceof ApiError ? cause.message : 'بررسی کد تخفیف ناموفق بود.'
    toast.error(previewError.value)
    return false
  }
}

async function submitOrder() {
  if (checkout.submitting || cart.busy || cart.stale) return
  if (!currentInput.value) {
    toast.error(pickup.value ? 'نام و شماره تماس معتبر وارد کنید.' : 'نشانی را ذخیره و روش تحویل را انتخاب کنید.')
    return
  }
  if (checkout.couponDraft.trim() !== checkout.couponCode && !(await applyCoupon())) return
  const input = currentInput.value
  try {
    const freshPreview = await checkout.fetchPreview(input)
    if (!freshPreview) return
    await checkout.createOrder(input)
    toast.success('سفارش ثبت شد.')
    void cart.fetchCart().catch(() => {})
  } catch (cause) {
    toast.error(cause instanceof ApiError ? cause.message : 'ثبت سفارش ناموفق بود.')
  }
}

async function loadCheckout() {
  loadError.value = ''
  const results = await Promise.allSettled([cart.fetchCart(), addresses.fetchAll(), locations.fetchAll(), checkout.fetchMethods()])
  if (results.some(result => result.status === 'rejected')) loadError.value = 'دریافت اطلاعات سفارش کامل نشد. دوباره تلاش کنید.'
}

onMounted(() => {
  checkout.resetOrder()
  void loadCheckout()
})

watch(() => addresses.items.map(item => item.id), ids => {
  if (selectedAddressId.value && !ids.includes(selectedAddressId.value)) addAddress()
  else if (!selectedAddressId.value && !editingId.value && ids.length && !draft.value.name && !draft.value.address) {
    const first = addresses.items[0]
    if (first) selectAddress(first)
  }
})
watch(() => checkout.methods.map(item => item.id), ids => {
  if (!ids.includes(selectedMethodId.value)) selectedMethodId.value = ''
})
watch(() => [currentInput.value?.cart_id, currentInput.value?.address_id, currentInput.value?.shipping_method_id, currentInput.value?.city_code, currentInput.value?.phone] as const,
  () => { void refreshPreview() })
watch(() => [cart.loaded, cart.busy, cart.itemCount, cart.error] as const, ([loaded, busy, count, error]) => {
  if (loaded && !busy && !count && !error && !checkout.order) void navigateTo('/cart')
})
</script>

<template>
  <div>
    <CartCheckoutStepper :step="checkout.order ? 3 : 2" />
    <div class="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <section v-if="checkout.order" class="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6 text-center sm:p-10">
        <UIcon name="solar:check-circle-bold" class="mx-auto size-14 text-success" />
        <h1 class="mt-4 text-xl font-bold text-text-primary">سفارش شما ثبت شد</h1>
        <p class="mt-3 text-sm text-text-secondary">شماره سفارش: <bdi class="font-semibold text-text-primary">{{ checkout.order.order_number }}</bdi></p>
        <p class="mt-2 text-sm text-text-secondary">مبلغ سفارش: {{ formatMoney(checkout.order.total_amount) }}</p>
        <p v-if="checkout.order.status === 'pending_payment'" class="mt-4 rounded-xl bg-warning-subtle p-4 text-sm text-text-secondary">سفارش در انتظار پرداخت است. درگاه پرداخت هنوز در این فروشگاه متصل نشده است.</p>
        <NuxtLink to="/" class="mt-6 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">بازگشت به فروشگاه</NuxtLink>
      </section>
      <template v-else>
        <p v-if="loadError" role="alert" class="mb-4 rounded-xl border border-danger-border p-4 text-sm text-danger">{{ loadError }} <button type="button" class="underline" @click="loadCheckout">تلاش دوباره</button></p>
        <p v-if="cart.error" role="alert" class="mb-4 rounded-xl border border-danger-border p-4 text-sm text-danger">{{ cart.error }} <button type="button" class="underline" @click="cart.fetchCart().catch(() => {})">دریافت دوباره سبد</button></p>
        <p v-if="!cart.loaded || cart.isLoading" role="status" class="p-8 text-center text-text-secondary">در حال دریافت سبد خرید…</p>
        <div v-else-if="cart.items.length" class="grid items-start gap-6 lg:grid-cols-12">
          <main class="space-y-6 lg:col-span-8">
            <CheckoutDeliveryMethods v-model="selectedMethodId" :methods="checkout.methods" :loading="checkout.loadingMethods" />
            <p v-if="addresses.error || locations.error" role="alert" class="rounded-xl border border-danger-border p-4 text-sm text-danger">{{ addresses.error || locations.error }} <button type="button" class="underline" @click="loadCheckout">تلاش دوباره</button></p>
            <CheckoutAddressForm v-model="draft" :pickup="pickup" :provinces="locations.provinces" :errors="errors" :pending="addresses.mutating || !locations.loaded" :selected-address="selectedAddress" @choose-address="addressSheetOpen = true" @new-address="addAddress" @save="saveAddress" />
            <p v-if="selectedMethod && !pickup && selectedAddress && !addressReady" class="rounded-xl border border-warning-border bg-warning-subtle p-4 text-sm text-text-secondary">اطلاعات این نشانی برای روش ارسال انتخاب‌شده کامل نیست. آن را تکمیل و ذخیره کنید.</p>
            <p v-if="checkout.previewing" role="status" class="text-sm text-text-secondary">در حال محاسبه هزینه سفارش…</p>
            <p v-if="previewError" role="alert" class="rounded-xl border border-danger-border p-4 text-sm text-danger">{{ previewError }} <button type="button" class="underline" @click="refreshPreview">محاسبه دوباره</button></p>
          </main>
          <div class="lg:col-span-4 lg:sticky lg:top-24"><CheckoutOrderSummary v-model:coupon="checkout.couponDraft" :items="cart.items" :subtotal-original="cart.subtotalOriginal" :cart-discount="cart.discount" :cart-total="cart.total" :preview="checkout.preview" :method="selectedMethod" :method-name="methodName" :pending="checkout.previewing || checkout.submitting" :disabled="cart.busy || cart.stale || addresses.loading || addresses.mutating || !currentInput" :coupon-disabled="cart.busy || cart.stale" :coupon-applied="!!checkout.preview && !!checkout.couponCode && checkout.couponDraft.trim() === checkout.couponCode" @apply-coupon="applyCoupon" @continue="submitOrder" /></div>
        </div>
      </template>
    </div>
    <UiBottomSheet v-model="addressSheetOpen" title="آدرس‌های ذخیره‌شده"><CheckoutAddressList :addresses="addresses.items" :provinces="locations.provinces" :selected-id="selectedAddressId" :disabled="addresses.loading || addresses.mutating" @select="id => { const address = addresses.items.find(item => item.id === id); if (address) selectAddress(address) }" @add="addAddress" @edit="selectAddress" /></UiBottomSheet>
  </div>
</template>
