export const useCheckoutStore = defineStore('checkout', () => {
  const api = useApi()
  const auth = useAuthStore()
  const methods = ref<ShippingMethod[]>([])
  const preview = ref<CheckoutPreview | null>(null)
  const order = ref<CheckoutOrder | null>(null)
  const couponDraft = ref('')
  const couponCode = ref('')
  const loadingMethods = ref(false)
  const previewing = ref(false)
  const submitting = ref(false)
  let previewGeneration = 0

  watch(() => auth.identity, () => {
    previewGeneration++
    preview.value = null
    order.value = null
    couponCode.value = ''
  }, { flush: 'sync' })

  async function fetchMethods() {
    loadingMethods.value = true
    try {
      methods.value = (await api.get<ShippingMethod[]>('/shipping/methods')).filter(method => method.enabled)
    } catch (cause) {
      throw withApiErrorContext(cause, 'checkout')
    } finally {
      loadingMethods.value = false
    }
  }

  function clearPreview() {
    previewGeneration++
    preview.value = null
    previewing.value = false
  }

  function resetOrder() {
    order.value = null
    clearPreview()
  }

  async function fetchPreview(input: CheckoutInput) {
    const generation = ++previewGeneration
    preview.value = null
    previewing.value = true
    try {
      const result = await api.post<CheckoutPreview>('/checkout/preview', input)
      console.log('checkout preview result', result)
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
    const identity = auth.identity
    try {
      const result = await api.post<CheckoutOrder>('/checkout', input)
      if (auth.identity !== identity) throw new ApiError('نشست کاربری تغییر کرده است؛ وضعیت سفارش را بررسی کنید.')
      order.value = result
      clearPreview()
      return result
    } catch (cause) {
      throw withApiErrorContext(cause, 'checkout')
    } finally {
      submitting.value = false
    }
  }

  return { methods, preview, order, couponDraft, couponCode, loadingMethods, previewing, submitting, fetchMethods, fetchPreview, clearPreview, resetOrder, createOrder }
})
