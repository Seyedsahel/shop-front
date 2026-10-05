export const usePaymentStore = defineStore('payments', () => {
  const api = useApi()
  const auth = useAuthStore()
  const methods = ref<PaymentMethod[]>([])
  const loadingMethods = ref(false)
  const starting = ref(false)

  async function fetchMethods() {
    loadingMethods.value = true
    try { methods.value = await api.get<PaymentMethod[]>('/payment-methods') }
    finally { loadingMethods.value = false }
  }

  async function start(orderId: string, methodId: string) {
    if (starting.value) throw new ApiError('پرداخت در حال شروع است.')
    starting.value = true
    const scope = auth.sessionScope ?? auth.identity
    try {
      const result = await api.post<PaymentRedirect>(`/orders/${encodeURIComponent(orderId)}/payments`, { method_id: methodId })
      if ((auth.sessionScope ?? auth.identity) !== scope) throw new ApiError('نشست کاربری تغییر کرده است؛ وضعیت سفارش را بررسی کنید.')
      return result
    } finally { starting.value = false }
  }

  return { methods, loadingMethods, starting, fetchMethods, start }
})
