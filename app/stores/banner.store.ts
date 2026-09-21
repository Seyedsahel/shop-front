
export const useBannerStore = defineStore('banner', () => {
  const homeHero = ref<Banner[]>([])
  const homeTop = ref<Banner[]>([])
  const homeMiddle = ref<Banner[]>([])
  const isLoading = ref(false)
  let fetched = false
  let pendingRequest: Promise<void> | undefined

  function fetchBanners() {
    if (fetched) return
    if (pendingRequest) return pendingRequest

    pendingRequest = (async () => {
      isLoading.value = true
      try {
        const res = await useApi().get<BannersResponse>('/engagement/banners')
        homeHero.value = res.homeHero
        homeTop.value = res.homeTop
        homeMiddle.value = res.homeMiddle
        fetched = true
      } catch (e) {
        useAppToast().error(e instanceof ApiError ? e.message : 'خطا در دریافت بنرها.')
      } finally {
        isLoading.value = false
        pendingRequest = undefined
      }
    })()

    return pendingRequest
  }

  return { homeHero, homeTop, homeMiddle, isLoading, fetchBanners }
})
