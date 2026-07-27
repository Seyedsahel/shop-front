
export const useBannerStore = defineStore('banner', () => {
  const duo = ref<Banner[]>([])
  const slider = ref<Banner[]>([])
  const isLoading = ref(false)
  let fetched = false

  async function fetchBanners() {
    if (fetched) return
    isLoading.value = true
    try {
      const res = await useApi().get<BannersResponse>('/engagement/banners')
      duo.value = res.duo
      slider.value = res.slider
      fetched = true
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'خطا در دریافت بنرها.')
    } finally {
      isLoading.value = false
    }
  }

  return { duo, slider, isLoading, fetchBanners }
})