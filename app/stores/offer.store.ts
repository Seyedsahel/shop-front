export const useOfferStore = defineStore('offer', () => {
  const discount = ref<HomepageDiscount | null>(null)
  const products = ref<Product[]>([])
  const isLoading = ref(false)
  const error = ref('')
  const hasLoaded = ref(false)
  const endsAt = computed(() => discount.value?.endsAt ?? null)

  async function fetchOffer(force = false) {
    if (isLoading.value || (hasLoaded.value && !force)) return
    isLoading.value = true
    error.value = ''
    try {
      const homepageDiscount = await useApi().get<HomepageDiscount | null>('/discounts/home')
      discount.value = homepageDiscount
      if (!homepageDiscount) {
        products.value = []
        hasLoaded.value = true
        return
      }

      const res = await useApi().post<ProductListResponse>('/catalog/product-list', {
        discountId: homepageDiscount.id,
        page: 1,
        limit: 20,
      } satisfies ProductListRequest)
      products.value = res.items
      hasLoaded.value = true
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'خطا در دریافت پیشنهادهای ویژه.'
      useAppToast().error(error.value)
    } finally {
      isLoading.value = false
    }
  }

  return { discount, products, endsAt, isLoading, error, fetchOffer }
})
