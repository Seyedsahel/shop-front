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
const saveToAccount = ref(false)
const confirmedAddress = ref<AddressInput | null>(null)
const draft = ref<AddressInput>(emptyDraft())
const errors = ref<Partial<Record<keyof AddressInput, string>>>({})
const previewError = ref('')
const loadError = ref('')
const recoveringAttempt = computed(() => !!checkout.attempt && !checkout.attempt.rejected)

function emptyDraft(): AddressInput {
  return { name: '', first_name: '', last_name: '', phone: '', province_code: 0, city_code: 0, postal_code: '', address: '' }
}

function validateAddress(): AddressInput | null {
  const input = normalizeCheckoutAddress(draft.value)
  if (!selectedMethod.value) return null
  errors.value = checkoutAddressErrors(input, addressRequirements.value, locations.provinces)
  return Object.keys(errors.value).length ? null : input
}

function addAddress() {
  saveToAccount.value = false
  confirmedAddress.value = null
  selectedAddressId.value = null
  draft.value = emptyDraft()
  errors.value = {}
  addressSheetOpen.value = false
  addressFormOpen.value = true
}

function selectAddress(address: Address) {
  saveToAccount.value = false
  selectedAddressId.value = address.id
  draft.value = {
    name: address.name ?? '', first_name: address.first_name ?? '', last_name: address.last_name ?? '', phone: address.phone_number ?? '',
    province_code: address.province_code ?? 0, city_code: address.city_code ?? 0,
    postal_code: address.postal_code ?? '', address: address.address ?? '',
  }
  errors.value = selectedMethod.value ? checkoutAddressErrors(normalizeCheckoutAddress(draft.value), addressRequirements.value, locations.provinces) : {}
  confirmedAddress.value = Object.keys(errors.value).length ? null : normalizeCheckoutAddress(draft.value)
  addressSheetOpen.value = false
  addressFormOpen.value = true
}

async function submitAddress() {
  if (addresses.mutating || !selectedMethod.value || (needsLocations.value && !locations.loaded)) return
  const input = validateAddress()
  if (!input) return
  if (pickup.value || !saveToAccount.value) {
    confirmedAddress.value = input
    toast.success('اطلاعات تحویل تأیید شد.')
    return
  }
  const payload = checkoutAddressPayload(input, input.name || methodName.value)
  const methodId = selectedMethodId.value
  try {
    const address = addressSaved.value && selectedAddress.value
      ? selectedAddress.value : await addresses.create(payload)
    if (selectedMethodId.value === methodId && JSON.stringify(normalizeCheckoutAddress(draft.value)) === JSON.stringify(input)) selectAddress(address)
    toast.success('نشانی ذخیره شد.')
  } catch (cause) {
    toast.error(cause instanceof ApiError ? cause.message : 'ذخیره نشانی ناموفق بود.')
  }
}

const selectedMethod = computed(() => checkout.methods.find(item => item.id === selectedMethodId.value))
const pickup = computed(() => selectedMethod.value?.code === 'local_pickup')
const addressRequirements = computed<ShippingAddressRequirements>(() => pickup.value
  ? { first_name: true, last_name: true, phone: true } : selectedMethod.value?.address_requirements ?? {})
const selectedAddress = computed(() => addresses.items.find(item => item.id === selectedAddressId.value) ?? null)
const needsLocations = computed(() => !!(addressRequirements.value.province_code || addressRequirements.value.city_code))
const savedDraft = computed<AddressInput | null>(() => {
  const address = selectedAddress.value
  return address ? normalizeCheckoutAddress({ name: address.name ?? '', first_name: address.first_name ?? '', last_name: address.last_name ?? '', phone: address.phone_number ?? '', province_code: address.province_code ?? 0, city_code: address.city_code ?? 0, postal_code: address.postal_code ?? '', address: address.address ?? '' }) : null
})
const addressSaved = computed(() => !!savedDraft.value && JSON.stringify(normalizeCheckoutAddress(draft.value)) === JSON.stringify(savedDraft.value))
const addressReady = computed(() => !!savedDraft.value && !!selectedMethod.value && !Object.keys(checkoutAddressErrors(savedDraft.value, addressRequirements.value, locations.provinces)).length)
const methodNames: Record<string, string> = { bike_courier: 'پیک موتوری', local_pickup: 'تحویل حضوری', tapin_post: 'پست' }
const methodName = computed(() => methodNames[selectedMethod.value?.code ?? ''] ?? selectedMethod.value?.name ?? '')
const currentInput = computed<CheckoutInput | null>(() => {
  if (!cart.cart?.id || !selectedMethod.value || !confirmedAddress.value) return null
  const input = normalizeCheckoutAddress(draft.value)
  if (JSON.stringify(input) !== JSON.stringify(confirmedAddress.value)
    || Object.keys(checkoutAddressErrors(input, addressRequirements.value, locations.provinces)).length) return null
  if (!pickup.value && saveToAccount.value && !addressSaved.value) return null
  const source = !pickup.value && addressSaved.value && addressReady.value && selectedAddressId.value
    ? { address_id: selectedAddressId.value } : { address: checkoutInlineAddressPayload(input, pickup.value) }
  return {
    ...source,
    cart_id: cart.cart.id,
    shipping_method_id: selectedMethodId.value,
    ...(checkout.couponCode ? { coupon_code: checkout.couponCode } : {}),
    ...(checkout.attempt?.input.torob_clid !== undefined ? { torob_clid: checkout.attempt.input.torob_clid } : {}),
  }
})

async function refreshPreview() {
  checkout.clearPreview()
  previewError.value = ''
  const input = currentInput.value
  if (!input || cart.stale || recoveringAttempt.value || finalizing.value) return
  try {
    await checkout.fetchPreview(input)
  } catch (cause) {
    previewError.value = cause instanceof ApiError ? cause.message : 'محاسبه سفارش ناموفق بود.'
  }
}

async function applyCoupon(): Promise<boolean> {
  if (checkout.previewing || checkout.submitting || recoveringAttempt.value) return false
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
  if (finalizing.value || checkout.submitting || payments.starting || cart.busy || cart.stale || recoveringAttempt.value || recoveryFailed.value) return
  if (!payments.methods.some(method => method.id === selectedPaymentMethodId.value)) {
    toast.error('ابتدا روش پرداخت را انتخاب کنید.')
    return
  }
  if (!selectedMethod.value) {
    toast.error('ابتدا شیوه تحویل را انتخاب کنید.')
    return
  }
  if (!currentInput.value) {
    toast.error(pickup.value ? 'نام و شماره تماس معتبر وارد کنید.' : 'اطلاعات تحویل را تکمیل و تأیید کنید.')
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
  if (finalizing.value || checkout.submitting || payments.starting || recoveryFailed.value) return
  if (!checkout.attempt?.checkoutExpired && (!checkout.order || checkout.order.id !== checkout.attempt?.orderId)) return
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
  const saved = checkout.attempt?.input
  if (saved && checkout.attempt?.rejected) {
    selectedMethodId.value = saved.shipping_method_id
    checkout.couponCode = saved.coupon_code ?? ''
    checkout.couponDraft = checkout.couponCode
    const address = addresses.items.find(item => item.id === saved.address_id)
    if (saved.address) {
      draft.value = { ...emptyDraft(), ...saved.address }
      addressFormOpen.value = true
      confirmedAddress.value = normalizeCheckoutAddress(draft.value)
    } else if (address) selectAddress(address)
  }
  await recoverOrder().catch(() => {})
})

watch(() => addresses.items.map(item => item.id), ids => {
  if (selectedAddressId.value && !ids.includes(selectedAddressId.value)) addAddress()
})
watch(addressRequirements, () => {
  if (pickup.value) saveToAccount.value = false
  errors.value = (selectedAddress.value || confirmedAddress.value) && selectedMethod.value
    ? checkoutAddressErrors(normalizeCheckoutAddress(draft.value), addressRequirements.value, locations.provinces) : {}
}, { deep: true })
watch(() => checkout.methods.map(item => item.id), ids => {
  if (!ids.includes(selectedMethodId.value)) selectedMethodId.value = ''
})
watch(() => auth.isAuthenticated, authenticated => {
  if (!authenticated) auth.requireAuth('/checkout')
})
watch(() => JSON.stringify(currentInput.value),
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
      <section v-if="recoveringAttempt || recoveryFailed" class="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6 sm:p-10">
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
        <button v-if="checkout.attempt?.checkoutExpired || checkout.order" type="button" :disabled="finalizing || checkout.submitting || payments.starting || recoveryFailed" class="mt-4 text-sm font-semibold text-primary disabled:opacity-50" @click="startNewCheckout">شروع سفارش جدید</button>
      </section>
      <template v-else>
        <p v-if="cart.error" role="alert" class="mb-4 rounded-xl border border-danger-border p-4 text-sm text-danger">{{ cart.error }} <button type="button" class="underline" @click="cart.fetchCart().catch(() => {})">دریافت دوباره سبد</button></p>
        <p v-if="!cart.loaded || cart.isLoading" role="status" class="p-8 text-center text-text-secondary">در حال دریافت سبد خرید…</p>
        <div v-else-if="cart.items.length" class="grid items-start gap-6 lg:grid-cols-12">
          <main class="space-y-6 lg:col-span-8">
            <CheckoutDeliveryMethods v-model="selectedMethodId" :methods="checkout.methods" :loading="checkout.loadingMethods" />
            <p v-if="addresses.error || locations.error" role="alert" class="rounded-xl border border-danger-border p-4 text-sm text-danger">{{ addresses.error || locations.error }} <button type="button" class="underline" @click="loadCheckout">تلاش دوباره</button></p>
            <CheckoutAddressForm v-model="draft" v-model:save-to-account="saveToAccount" :pickup="pickup" :requirements="addressRequirements" :open="addressFormOpen" :provinces="locations.provinces" :errors="errors" :pending="addresses.mutating || !selectedMethod || (needsLocations && !locations.loaded)" :selected-address="selectedAddress" @choose-address="addressSheetOpen = true" @change-address="addressSheetOpen = true" @new-address="addAddress" @submit="submitAddress" />
            <p v-if="selectedMethod && selectedAddress && !addressReady && !currentInput" class="rounded-xl border border-warning-border bg-warning-subtle p-4 text-sm text-text-secondary">اطلاعات این نشانی برای روش ارسال انتخاب‌شده کامل نیست. آن را تکمیل و تأیید کنید.</p>
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
