
export const useBannerStore = defineStore('banner', () => {
  const api = useApi()
  const homeHero = ref<Banner[]>([])
  const homeTop = ref<Banner[]>([])
  const homeMiddle = ref<Banner[]>([])
  const isLoading = ref(false)
  const fetched = ref(false)
  const error = ref('')
  let pendingRequest: Promise<void> | undefined

  function fetchBanners() {
    if (fetched.value) return
    if (pendingRequest) return pendingRequest

    pendingRequest = (async () => {
      isLoading.value = true
      error.value = ''
      try {
        const res = await api.get<BannersResponse>('/banners')
        homeHero.value = res.homeHero
        homeTop.value = res.homeTop
        homeMiddle.value = res.homeMiddle
        fetched.value = true
      } catch (e) {
        error.value = e instanceof ApiError ? e.message : 'خطا در دریافت بنرها.'
      } finally {
        isLoading.value = false
        pendingRequest = undefined
      }
    })()

    return pendingRequest
  }

  return { homeHero, homeTop, homeMiddle, isLoading, error, fetched, fetchBanners }
})
