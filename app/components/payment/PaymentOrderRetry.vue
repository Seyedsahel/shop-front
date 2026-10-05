<script setup lang="ts">
const props = defineProps<{ orderId: string }>()
const payments = usePaymentStore()
const orders = useOrderStore()
const checkout = useCheckoutStore()
const auth = useAuthStore()
const methodId = ref('')
const pending = ref(false)
const error = ref('')

async function loadMethods() {
  try { await payments.fetchMethods() }
  catch (cause) { error.value = getUserFriendlyApiErrorMessage(cause) }
}

async function retryPayment() {
  if (pending.value || payments.starting || !payments.methods.some(method => method.id === methodId.value)) return
  pending.value = true
  error.value = ''
  const id = props.orderId
  const scope = auth.sessionScope ?? auth.identity
  try {
    if (checkout.attempt?.orderId === id && (checkout.attempt.paymentBlocked || checkout.attempt.checkoutExpired)) {
      throw new ApiError('این تلاش پرداخت نیاز به بررسی دارد. وضعیت سفارش را از صفحه پرداخت پیگیری کنید.')
    }
    await orders.fetchOne(id)
    if (!auth.isAuthenticated || (auth.sessionScope ?? auth.identity) !== scope) throw new ApiError('برای ادامه پرداخت دوباره وارد حساب کاربری شوید.')
    if (orders.current?.id !== id || orders.current.status !== 'pending_payment' || orders.current.total_amount <= 0) {
      throw new ApiError('وضعیت این سفارش اجازه شروع پرداخت نمی‌دهد. جزئیات سفارش را بررسی کنید.')
    }
    // Retrying payment always uses the existing order, including after a gateway failure.
    const result = await payments.start(id, methodId.value)
    window.location.assign(result.redirect_url)
  } catch (cause) {
    if (checkout.attempt?.orderId === id) {
      try { checkout.recordPaymentFailure(cause) }
      catch (storageError) { error.value = getUserFriendlyApiErrorMessage(storageError) }
    }
    error.value ||= getUserFriendlyApiErrorMessage(cause)
  } finally { pending.value = false }
}

onMounted(loadMethods)
</script>

<template>
  <section class="mt-6 rounded-2xl border border-border bg-card p-6">
    <h2 class="text-lg font-bold text-text-primary">پرداخت سفارش موجود</h2>
    <CheckoutPaymentMethods v-model="methodId" class="mt-4" :methods="payments.methods" :loading="payments.loadingMethods" :disabled="pending || payments.starting" />
    <p v-if="error" role="alert" class="mt-4 text-sm text-danger">{{ error }}</p>
    <button type="button" class="mt-4 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50" :disabled="pending || payments.starting || !methodId" @click="retryPayment">{{ pending ? 'در حال بررسی سفارش…' : 'تلاش دوباره برای پرداخت' }}</button>
  </section>
</template>
