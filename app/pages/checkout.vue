<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const cart = useCartStore()
const addresses = useAddressStore()
const locations = useShippingLocationsStore()
const checkout = useCheckoutStore()
const auth = useAuthStore()
const payments = usePaymentStore()
const orders = useOrderStore()
const selectedPaymentMethodId = ref('')
const finalizing = ref(false)
const recoveryError = ref('')
const recoveryFailed = ref(false)
const paymentError = ref('')
const toast = useAppToast()
const selectedAddressId = ref<string | null>(null)
const selectedMethodId = ref('')
const addressSheetOpen = ref(false)
const addressFormOpen = ref(false)
const editingId = ref<string | null>(null)
const draft = ref<AddressInput>(emptyDraft())
const errors = ref<Partial<Record<keyof AddressInput, string>>>({})
const previewError = ref('')
const loadError = ref('')

function emptyDraft(): AddressInput {
  return { name: '', first_name: '', last_name: '', phone: '', province_code: 0, city_code: 0, postal_code: '', address: '' }
}

function normalizeDigits(value: string) {
  return value.replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x0660))
}

function validateAddress(): AddressInput | null {
  const input: AddressInput = {
    name: draft.value.name.trim(),
    first_name: draft.value.first_name.trim(),
    last_name: draft.value.last_name.trim(),
    phone: normalizeDigits(draft.value.phone.trim()).replace(/^(?:\+98|0098)/, '0'),
    province_code: draft.value.province_code,
    city_code: draft.value.city_code,
    postal_code: normalizeDigits(draft.value.postal_code.trim()),
    address: draft.value.address.trim(),
  }
  const next: typeof errors.value = {}
  if (!input.name) next.name = 'عنوان نشانی را وارد کنید.'
  if (!input.first_name) next.first_name = 'نام تحویل‌گیرنده را وارد کنید.'
  if (!input.last_name) next.last_name = 'نام خانوادگی تحویل‌گیرنده را وارد کنید.'
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
  addressFormOpen.value = true
}

function selectAddress(address: Address) {
  editingId.value = address.id
  selectedAddressId.value = address.id
  draft.value = {
    name: address.name, first_name: address.first_name, last_name: address.last_name, phone: address.phone_number,
    province_code: address.province_code, city_code: address.city_code,
    postal_code: address.postal_code, address: address.address,
  }
  errors.value = {}
  addressSheetOpen.value = false
  addressFormOpen.value = true
}

async function saveAddress() {
  if (addresses.mutating || !locations.loaded) return
  if (pickup.value && !selectedAddressId.value) {
    toast.error('برای ثبت اطلاعات تحویل‌گیرنده ابتدا یک نشانی در حساب کاربری ذخیره کنید.')
    return
  }
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
  return !!address && draft.value.name === address.name && draft.value.first_name === address.first_name && draft.value.last_name === address.last_name && draft.value.phone === address.phone_number
    && draft.value.province_code === address.province_code && draft.value.city_code === address.city_code
    && draft.value.postal_code === address.postal_code && draft.value.address === address.address
})
const addressReady = computed(() => {
  const address = selectedAddress.value
  const requirements = selectedMethod.value?.address_requirements
  if (!address || !requirements) return false
  return (!requirements.recipient_name || !!address.first_name.trim() && !!address.last_name.trim())
    && (!requirements.phone || !!address.phone_number.trim())
    && (!requirements.province_code || address.province_code > 0)
    && (!requirements.city_code || address.city_code > 0)
    && (!requirements.address || !!address.address.trim())
    && (!requirements.postal_code || /^\d{10}$/.test(normalizeDigits(address.postal_code)))
})
const methodNames: Record<string, string> = { bike_courier: 'پیک موتوری', local_pickup: 'تحویل حضوری', tapin_post: 'پست' }
const methodName = computed(() => methodNames[selectedMethod.value?.code ?? ''] ?? selectedMethod.value?.name ?? '')
const currentInput = computed<CheckoutInput | null>(() => {
  if (!cart.cart?.id || !selectedMethod.value || !selectedAddressId.value || !selectedAddress.value) return null
  if (pickup.value) {
    const phone = normalizeDigits(draft.value.phone.trim()).replace(/^(?:\+98|0098)/, '0')
    if (!draft.value.first_name.trim() || !draft.value.last_name.trim() || !/^09\d{9}$/.test(phone) || !addressSaved.value) return null
  } else if (!addressSaved.value || !addressReady.value) return null
  return {
    address_id: selectedAddressId.value,
    cart_id: cart.cart.id,
    shipping_method_id: selectedMethodId.value,
    ...(checkout.couponCode ? { coupon_code: checkout.couponCode } : {}),
  }
})

async function refreshPreview() {
  checkout.clearPreview()
  previewError.value = ''
  const input = currentInput.value
  if (!input || cart.stale || checkout.attempt || finalizing.value) return
  try {
    await checkout.fetchPreview(input)
  } catch (cause) {
    previewError.value = cause instanceof ApiError ? cause.message : 'محاسبه سفارش ناموفق بود.'
  }
}

async function applyCoupon(): Promise<boolean> {
  if (checkout.previewing || checkout.submitting || checkout.attempt) return false
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
  if (finalizing.value || checkout.submitting || payments.starting || cart.busy || cart.stale || checkout.attempt || recoveryFailed.value) return
  if (!payments.methods.some(method => method.id === selectedPaymentMethodId.value)) {
    toast.error('ابتدا روش پرداخت را انتخاب کنید.')
    return
  }
  if (!selectedMethod.value) {
    toast.error('ابتدا شیوه تحویل را انتخاب کنید.')
    return
  }
  if (!selectedAddress.value) {
    toast.error('ابتدا یک نشانی تحویل را انتخاب یا ثبت کنید.')
    return
  }
  if (!currentInput.value) {
    toast.error(pickup.value ? 'نام و شماره تماس معتبر وارد کنید.' : 'نشانی را ذخیره و روش تحویل را انتخاب کنید.')
    return
  }
  finalizing.value = true
  try {
    if (checkout.couponDraft.trim() !== checkout.couponCode && !(await applyCoupon())) return
    const input = currentInput.value
    if (!input) return
    const freshPreview = await checkout.fetchPreview(input)
    if (!freshPreview) return
    await checkout.createOrder(input)
    await startPayment()
  } catch (cause) {
    toast.error(cause instanceof ApiError ? cause.message : 'ثبت سفارش ناموفق بود.')
  } finally {
    finalizing.value = false
  }
}

async function recoverOrder() {
  recoveryError.value = ''
  const id = checkout.attempt?.orderId
  if (!id) return
  try {
    await orders.fetchOne(id)
    if (!orders.current || orders.current.id !== id) throw new Error('Order unavailable')
    checkout.order = orders.current
  } catch (cause) {
    recoveryError.value = cause instanceof ApiError ? cause.message : 'بازیابی سفارش ناموفق بود. سفارش‌های حساب کاربری را بررسی کنید.'
    throw cause
  }
}

async function startPayment() {
  const attempt = checkout.attempt
  if (!attempt?.orderId || payments.starting || attempt.paymentBlocked || attempt.checkoutExpired) return
  const methodId = attempt.paymentMethodId ?? selectedPaymentMethodId.value
  if (!payments.methods.some(method => method.id === methodId)) {
    toast.error('روش پرداخت انتخاب‌شده در دسترس نیست.')
    return
  }
  paymentError.value = ''
  const scope = auth.sessionScope ?? auth.identity
  try {
    // Recover server truth before any repeat payment request.
    await recoverOrder()
    if (!auth.isAuthenticated || (auth.sessionScope ?? auth.identity) !== scope) throw new ApiError('برای ادامه پرداخت دوباره وارد حساب کاربری شوید.')
    if (checkout.order?.status !== 'pending_payment') {
      toast.error('وضعیت این سفارش اجازه شروع پرداخت نمی‌دهد. جزئیات سفارش را بررسی کنید.')
      return
    }
    if (checkout.order.total_amount <= 0) {
      toast.error('این مسیر برای سفارش با مبلغ صفر قابل استفاده نیست.')
      return
    }
    checkout.saveAttempt({ ...attempt, paymentMethodId: methodId, paymentUncertain: true })
    const result = await payments.start(attempt.orderId, methodId)
    window.location.assign(result.redirect_url)
  } catch (cause) {
    if ((auth.sessionScope ?? auth.identity) !== scope) return
    try { checkout.recordPaymentFailure(cause) }
    catch { recoveryFailed.value = true }
    if (checkout.attempt?.checkoutExpired) {
      paymentError.value = 'مهلت پرداخت این سفارش تمام شده است. برای ادامه، سفارش جدیدی ثبت کنید.'
    } else if (checkout.attempt?.paymentBlocked) {
      paymentError.value = `${cause instanceof ApiError ? cause.message : 'شروع پرداخت امکان‌پذیر نیست.'} وضعیت تلاش پرداخت نیاز به بررسی دارد؛ از سفارش موجود پیگیری کنید.`
    } else {
      paymentError.value = cause instanceof ApiError ? cause.message : 'شروع پرداخت تأیید نشد. پیش از تلاش دوباره، وضعیت سفارش را بررسی کنید.'
    }
    // A response failure cannot justify creating a replacement order.
    await recoverOrder().catch(() => {})
    toast.error(paymentError.value)
  }
}

async function resumeCheckout() {
  if (finalizing.value || recoveryFailed.value || checkout.attempt?.paymentBlocked || checkout.attempt?.checkoutExpired) return
  const attempt = checkout.attempt
  if (!attempt) return
  finalizing.value = true
  try {
    if (!attempt.orderId) await checkout.createOrder(attempt.input)
    await startPayment()
  } catch (cause) {
    toast.error(cause instanceof ApiError ? cause.message : 'بازیابی سفارش ناموفق بود.')
  } finally { finalizing.value = false }
}

async function loadCheckout() {
  loadError.value = ''
  const results = await Promise.allSettled([cart.fetchCart(), addresses.fetchAll(), locations.fetchAll(), checkout.fetchMethods(), payments.fetchMethods()])
  if (results.some(result => result.status === 'rejected')) loadError.value = 'دریافت اطلاعات سفارش کامل نشد. دوباره تلاش کنید.'
}

function startNewCheckout() {
  if (!checkout.attempt?.checkoutExpired && (!checkout.order || checkout.order.status === 'pending_payment')) return
  checkout.forgetAttempt()
  selectedPaymentMethodId.value = ''
  recoveryError.value = ''
  paymentError.value = ''
  void loadCheckout()
}

onMounted(async () => {
  try {
    checkout.restoreAttempt()
    selectedPaymentMethodId.value = checkout.attempt?.paymentMethodId ?? ''
  } catch (cause) {
    recoveryFailed.value = true
    recoveryError.value = cause instanceof ApiError ? cause.message : 'بازیابی سفارش ناموفق بود.'
  }
  await loadCheckout()
  await recoverOrder().catch(() => {})
})

watch(() => addresses.items.map(item => item.id), ids => {
  if (selectedAddressId.value && !ids.includes(selectedAddressId.value)) addAddress()
})
watch(() => checkout.methods.map(item => item.id), ids => {
  if (!ids.includes(selectedMethodId.value)) selectedMethodId.value = ''
})
watch(() => auth.isAuthenticated, authenticated => {
  if (!authenticated) auth.requireAuth('/checkout')
})
watch(() => [currentInput.value?.cart_id, currentInput.value?.address_id, currentInput.value?.shipping_method_id] as const,
  () => { void refreshPreview() })
watch(() => [cart.loaded, cart.busy, cart.itemCount, cart.error] as const, ([loaded, busy, count, error]) => {
  if (loaded && !busy && !count && !error && !checkout.attempt && !recoveryFailed.value) void navigateTo('/cart')
})
</script>

<template>
  <div>
    <CartCheckoutStepper :step="checkout.order ? 3 : 2" />
    <div class="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <p v-if="loadError" role="alert" class="mb-4 rounded-xl border border-danger-border p-4 text-sm text-danger">{{ loadError }} <button type="button" class="underline" @click="loadCheckout">تلاش دوباره</button></p>
      <section v-if="checkout.attempt || recoveryFailed" class="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6 sm:p-10">
        <h1 class="text-xl font-bold text-text-primary">پیگیری سفارش و پرداخت</h1>
        <p v-if="checkout.attempt?.orderId" class="mt-3 text-sm text-text-secondary">شناسه سفارش: <bdi>{{ checkout.attempt.orderId }}</bdi></p>
        <p v-if="checkout.order" class="mt-3 text-sm text-text-secondary">شماره سفارش: <bdi>{{ checkout.order.order_number }}</bdi> · {{ orderStatusLabel(checkout.order.status) }}</p>
        <p v-else class="mt-3 text-sm text-text-secondary">نتیجه ثبت سفارش هنوز تأیید نشده است. ادامه، همان درخواست قبلی را بازیابی می‌کند.</p>
        <p v-if="checkout.order" class="mt-2 text-sm text-text-secondary">مبلغ سفارش: {{ formatMoney(checkout.order.total_amount) }}</p>
        <p v-if="recoveryError || paymentError" role="alert" class="mt-4 text-sm text-danger">{{ recoveryError || paymentError }}</p>
        <p v-if="checkout.attempt?.paymentBlocked" role="alert" class="mt-4 text-sm text-warning">تلاش پرداخت نیاز به بررسی دارد. برای پیگیری با پشتیبانی تماس بگیرید.</p>
        <p v-if="checkout.attempt?.checkoutExpired" role="alert" class="mt-4 text-sm text-warning">مهلت پرداخت این سفارش تمام شده است. برای ادامه، سفارش جدیدی ثبت کنید.</p>
        <template v-if="!recoveryFailed && !checkout.attempt?.checkoutExpired && (!checkout.order || checkout.order.status === 'pending_payment')">
          <CheckoutPaymentMethods v-model="selectedPaymentMethodId" class="mt-5" :methods="payments.methods" :loading="payments.loadingMethods" :disabled="finalizing || !!checkout.attempt?.paymentMethodId" />
          <button type="button" class="mt-5 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50" :disabled="finalizing || payments.starting || orders.detailLoading || !!checkout.attempt?.paymentBlocked || !selectedPaymentMethodId" @click="resumeCheckout">{{ finalizing ? 'در حال بررسی سفارش…' : 'نهایی‌سازی پرداخت و ثبت سفارش' }}</button>
        </template>
        <NuxtLink v-if="checkout.attempt?.orderId" :to="`/profile/orders/${encodeURIComponent(checkout.attempt.orderId)}`" class="mt-5 block text-sm text-primary">مشاهده جزئیات سفارش</NuxtLink>
        <NuxtLink to="/profile" class="mt-4 block text-sm text-primary">مشاهده سفارش‌های حساب کاربری</NuxtLink>
        <button v-if="checkout.attempt?.checkoutExpired || (checkout.order && checkout.order.status !== 'pending_payment')" type="button" class="mt-4 text-sm font-semibold text-primary" @click="startNewCheckout">شروع سفارش جدید</button>
      </section>
      <template v-else>
        <p v-if="cart.error" role="alert" class="mb-4 rounded-xl border border-danger-border p-4 text-sm text-danger">{{ cart.error }} <button type="button" class="underline" @click="cart.fetchCart().catch(() => {})">دریافت دوباره سبد</button></p>
        <p v-if="!cart.loaded || cart.isLoading" role="status" class="p-8 text-center text-text-secondary">در حال دریافت سبد خرید…</p>
        <div v-else-if="cart.items.length" class="grid items-start gap-6 lg:grid-cols-12">
          <main class="space-y-6 lg:col-span-8">
            <CheckoutDeliveryMethods v-model="selectedMethodId" :methods="checkout.methods" :loading="checkout.loadingMethods" />
            <p v-if="addresses.error || locations.error" role="alert" class="rounded-xl border border-danger-border p-4 text-sm text-danger">{{ addresses.error || locations.error }} <button type="button" class="underline" @click="loadCheckout">تلاش دوباره</button></p>
            <CheckoutAddressForm v-model="draft" :pickup="pickup" :open="addressFormOpen" :provinces="locations.provinces" :errors="errors" :pending="addresses.mutating || !locations.loaded" :selected-address="selectedAddress" @choose-address="addressSheetOpen = true" @change-address="addressSheetOpen = true" @new-address="addAddress" @save="saveAddress" />
            <p v-if="selectedMethod && !pickup && selectedAddress && !addressReady" class="rounded-xl border border-warning-border bg-warning-subtle p-4 text-sm text-text-secondary">اطلاعات این نشانی برای روش ارسال انتخاب‌شده کامل نیست. آن را تکمیل و ذخیره کنید.</p>
            <p v-if="checkout.previewing" role="status" class="text-sm text-text-secondary">در حال محاسبه هزینه سفارش…</p>
            <p v-if="previewError" role="alert" class="rounded-xl border border-danger-border p-4 text-sm text-danger">{{ previewError }} <button type="button" class="underline" @click="refreshPreview">محاسبه دوباره</button></p>
          </main>
          <div class="lg:col-span-4 lg:sticky lg:top-24"><CheckoutOrderSummary v-model:coupon="checkout.couponDraft" v-model:payment-method="selectedPaymentMethodId" :payment-methods="payments.methods" :loading-payment-methods="payments.loadingMethods" :items="cart.items" :subtotal-original="cart.subtotalOriginal" :cart-discount="cart.discount" :cart-total="cart.total" :preview="checkout.preview" :method="selectedMethod" :method-name="methodName" :pending="finalizing || checkout.previewing || checkout.submitting || payments.starting" :disabled="cart.busy || cart.stale || addresses.loading || addresses.mutating || !currentInput" :coupon-disabled="cart.busy || cart.stale" :coupon-applied="!!checkout.preview && !!checkout.couponCode && checkout.couponDraft.trim() === checkout.couponCode" @apply-coupon="applyCoupon" @continue="submitOrder" /></div>
        </div>
      </template>
    </div>
    <UiBottomSheet v-model="addressSheetOpen" title="آدرس‌های ذخیره‌شده"><CheckoutAddressList :addresses="addresses.items" :provinces="locations.provinces" :selected-id="selectedAddressId" :disabled="addresses.loading || addresses.mutating" @select="id => { const address = addresses.items.find(item => item.id === id); if (address) selectAddress(address) }" @add="addAddress" @edit="selectAddress" /></UiBottomSheet>
  </div>
</template>
