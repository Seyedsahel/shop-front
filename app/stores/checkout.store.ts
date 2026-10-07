export const useCheckoutStore = defineStore('checkout', () => {
  const api = useApi()
  const auth = useAuthStore()
  const publish = useSessionSync()
  const methods = ref<ShippingMethod[]>([])
  const preview = ref<CheckoutPreview | null>(null)
  const order = ref<CheckoutOrder | null>(null)
  const attempt = ref<CheckoutAttempt | null>(null)
  const couponDraft = ref('')
  const couponCode = ref('')
  const loadingMethods = ref(false)
  const methodsLoaded = ref(false)
  const methodsError = ref('')
  let methodsRequest: Promise<void> | null = null
  const previewing = ref(false)
  const submitting = ref(false)
  let previewGeneration = 0

  watch(() => auth.sessionScope ?? auth.identity, () => {
    previewGeneration++
    preview.value = null
    order.value = null
    attempt.value = null
    couponCode.value = ''
  }, { flush: 'sync' })

  function fetchMethods(force = false): Promise<void> {
    if (methodsRequest) return methodsRequest
    if (methodsLoaded.value && !force) return Promise.resolve()
    loadingMethods.value = true
    methodsError.value = ''
    methodsRequest = api.get<ShippingMethod[]>('/shipping/methods').then(result => {
      methods.value = result.filter(method => method.enabled)
      methodsLoaded.value = true
    }).catch(cause => {
      methodsError.value = serializeApiError(cause, 'دریافت روش‌های سفارش ناموفق بود.').message
      throw cause
    }).finally(() => { loadingMethods.value = false; methodsRequest = null })
    return methodsRequest
  }

  function clearPreview() {
    previewGeneration++
    preview.value = null
    previewing.value = false
  }

  function saveAttempt(next: CheckoutAttempt) {
    const scope = auth.sessionScope ?? auth.identity
    if (!import.meta.client || !scope) throw new ApiError('برای ثبت سفارش وارد حساب کاربری شوید.')
    try { localStorage.setItem(checkoutAttemptStorageKey(scope), JSON.stringify(next)) }
    catch { throw new ApiError('ذخیره امن تلاش پرداخت در مرورگر ممکن نیست. تنظیمات ذخیره‌سازی مرورگر را بررسی کنید.') }
    attempt.value = next
  }

  function restoreAttempt() {
    const scope = auth.sessionScope ?? auth.identity
    if (!import.meta.client || !scope) return
    try {
      const saved = localStorage.getItem(checkoutAttemptStorageKey(scope))
      if (!saved) return
      const parsed = JSON.parse(saved) as CheckoutAttempt
      if (typeof parsed.key !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parsed.key)
        || !isRecoverableCheckoutInput(parsed.input)
        || (parsed.input.coupon_code !== undefined && typeof parsed.input.coupon_code !== 'string')
        || (parsed.input.torob_clid !== undefined && typeof parsed.input.torob_clid !== 'string')
        || (parsed.rejected !== undefined && typeof parsed.rejected !== 'boolean')
        || (parsed.rejected === true && parsed.orderId !== undefined)
        || (parsed.orderId !== undefined && typeof parsed.orderId !== 'string')
        || (parsed.paymentMethodId !== undefined && typeof parsed.paymentMethodId !== 'string')
        || (parsed.paymentBlocked !== undefined && typeof parsed.paymentBlocked !== 'boolean')
        || (parsed.checkoutExpired !== undefined && typeof parsed.checkoutExpired !== 'boolean')) throw new Error('Invalid attempt')
      attempt.value = parsed
    } catch { throw new ApiError('بازیابی سفارش ذخیره‌شده ممکن نیست. پیش از سفارش جدید، سفارش‌های حساب کاربری را بررسی کنید.') }
  }

  function forgetAttempt() {
    const scope = auth.sessionScope ?? auth.identity
    if (import.meta.client && scope) localStorage.removeItem(checkoutAttemptStorageKey(scope))
    attempt.value = null
    order.value = null
    clearPreview()
  }

  function recordPaymentFailure(cause: unknown) {
    if (!attempt.value || !(cause instanceof ApiError)) return
    const blocked = cause.status === 409
    const expired = cause.status === 400 && cause.validationMessage === 'checkout has expired'
    if (!blocked && !expired) return
    attempt.value = { ...attempt.value, ...(blocked ? { paymentBlocked: true } : { checkoutExpired: true }) }
    saveAttempt(attempt.value)
  }

  async function fetchPreview(input: CheckoutInput) {
    const generation = ++previewGeneration
    preview.value = null
    previewing.value = true
    try {
      const result = await api.post<CheckoutPreview>('/checkout/preview', input)
      if (generation !== previewGeneration) return null
      preview.value = result
      return result
    } catch (cause) {
      throw withApiErrorContext(cause, 'checkout')
    } finally {
      if (generation === previewGeneration) previewing.value = false
    }
  }

  async function createOrder(input: CheckoutInput) {
    if (submitting.value) throw new ApiError('سفارش در حال ثبت است.')
    submitting.value = true
    const scope = auth.sessionScope ?? auth.identity
    let sent = false
    try {
      if (!attempt.value) restoreAttempt()
      if (attempt.value?.rejected && !sameCheckoutInput(attempt.value.input, input)) {
        saveAttempt({ key: createCheckoutKey(), input: input.address ? { ...input, address: { ...input.address } } : { ...input } })
      }
      if (!attempt.value) saveAttempt({ key: createCheckoutKey(), input: input.address ? { ...input, address: { ...input.address } } : { ...input } })
      const saved = attempt.value!
      if (!sameCheckoutInput(saved.input, input)) throw new ApiError('اطلاعات تلاش قبلی ثبت سفارش تغییر کرده است. ابتدا وضعیت آن سفارش را بررسی کنید.')
      if (saved.orderId) throw new ApiError('سفارش قبلاً ایجاد شده است. پرداخت را از همان سفارش ادامه دهید.')
      // Persist uncertainty before sending: refreshes and lost responses must replay this body/key.
      saveAttempt({ ...saved, rejected: false })
      sent = true
      const result = await api.post<CheckoutOrder>('/checkout', saved.input, { headers: { 'Idempotency-Key': saved.key } })
      if ((auth.sessionScope ?? auth.identity) !== scope) throw new ApiError('نشست کاربری تغییر کرده است؛ وضعیت سفارش را بررسی کنید.')
      publish('orders')
      publish('cart')
      order.value = result
      saveAttempt({ ...saved, rejected: false, orderId: result.id })
      clearPreview()
      return result
    } catch (cause) {
      // A key/body conflict may refer to an existing order; it cannot authorize replacement.
      if (sent && (auth.sessionScope ?? auth.identity) === scope && cause instanceof ApiError
        && cause.kind === 'http' && [400, 422].includes(cause.status ?? 0)
        && cause.validationMessage !== 'idempotency key was used with a different request'
        && !order.value && attempt.value && !attempt.value.orderId) {
        saveAttempt({ ...attempt.value, rejected: true })
      }
      throw withApiErrorContext(cause, 'checkout')
    } finally {
      submitting.value = false
    }
  }

  return { methods, methodsLoaded, methodsError, preview, order, attempt, couponDraft, couponCode, loadingMethods, previewing, submitting, fetchMethods, fetchPreview, clearPreview, restoreAttempt, saveAttempt, forgetAttempt, recordPaymentFailure, createOrder }
})
