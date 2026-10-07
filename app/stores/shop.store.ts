export const useShopStore = defineStore('shop', () => {
  const api = useApi()
  const info = ref<ShopInfo | null>(null)
  const isLoading = ref(false)
  const error = ref('')
  const name = computed(() => info.value?.name || 'فروشگاه')
  const instagramUrl = computed(() => socialUrl('https://www.instagram.com/', info.value?.instagramId))
  const telegramUrl = computed(() => socialUrl('https://t.me/', info.value?.telegramId))
  let pending: Promise<boolean> | undefined

  function socialUrl(base: string, id?: string) {
    const username = id?.replace(/^@/, '').trim()
    return username ? base + encodeURIComponent(username) : ''
  }

  function fetchShop(): Promise<boolean> {
    if (info.value) return Promise.resolve(true)
    if (pending) return pending
    pending = load().finally(() => { pending = undefined })
    return pending
  }

  async function load(): Promise<boolean> {
    isLoading.value = true
    error.value = ''
    try {
      info.value = await api.get<ShopInfo>('/shop')
      return true
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'خطا در دریافت اطلاعات فروشگاه.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  return { info, name, instagramUrl, telegramUrl, isLoading, error, fetchShop }
})
