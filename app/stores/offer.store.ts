export const useOfferStore = defineStore('offer', () => {
  const products = ref<Product[]>([])
  const endsAt = ref<string | null>(null)
  const isLoading = ref(false)

  async function fetchOffer() {
    if (endsAt.value) return
    isLoading.value = true
    try {
      const res = await useApi().get<SpecialOfferResponse>('/engagement/special-offer')
      products.value = res.products
      endsAt.value = res.endsAt
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'خطا در دریافت پیشنهادهای ویژه.')
    } finally {
      isLoading.value = false
    }
  }

  return { products, endsAt, isLoading, fetchOffer }
})