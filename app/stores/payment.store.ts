export const usePaymentStore = defineStore('payments', () => {
  const api = useApi()
  const auth = useAuthStore()
  const publish = useSessionSync()
  const methods = ref<PaymentMethod[]>([])
  const loadingMethods = ref(false)
  const methodsLoaded = ref(false)
  const methodsError = ref('')
  let methodsRequest: Promise<void> | null = null
  const starting = ref(false)

  function fetchMethods(force = false): Promise<void> {
    if (methodsRequest) return methodsRequest
    if (methodsLoaded.value && !force) return Promise.resolve()
    loadingMethods.value = true
    methodsError.value = ''
    methodsRequest = api.get<PaymentMethod[]>('/payment-methods').then(result => {
      methods.value = result
      methodsLoaded.value = true
    }).catch(cause => {
      methodsError.value = serializeApiError(cause, 'دریافت روش‌های سفارش ناموفق بود.').message
      throw cause
    }).finally(() => { loadingMethods.value = false; methodsRequest = null })
    return methodsRequest
  }

  async function start(orderId: string, methodId: string) {
    if (starting.value) throw new ApiError('پرداخت در حال شروع است.')
    starting.value = true
    const scope = auth.sessionScope ?? auth.identity
    try {
      const result = await api.post<PaymentRedirect>(`/orders/${encodeURIComponent(orderId)}/payments`, { method_id: methodId })
      if ((auth.sessionScope ?? auth.identity) !== scope) throw new ApiError('نشست کاربری تغییر کرده است؛ وضعیت سفارش را بررسی کنید.')
      publish('orders')
      return result
    } finally { starting.value = false }
  }

  return { methods, methodsLoaded, methodsError, loadingMethods, starting, fetchMethods, start }
})
