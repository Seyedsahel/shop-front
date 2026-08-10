export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const isAdding = ref(false)

  const itemCount = computed(() =>
    items.value.reduce((sum, i) => sum + i.quantity, 0)
  )

  async function fetchCart() {
    try {
      const res = await useApi().get<CartResponse>('/ordering/cart')
      items.value = res.items
    } catch {
      // silent — badge just shows nothing if this fails, not worth a toast
    }
  }

  async function addItem(productId: string, quantity = 1) {
    isAdding.value = true
    try {
      // await useApi().post('/ordering/cart/items', { productId, quantity } satisfies AddCartItemPayload)
      const existing = items.value.find(i => i.productId === productId)
      if (existing) existing.quantity += quantity
      else items.value.push({ productId, quantity })
      useAppToast().success('محصول به سبد خرید اضافه شد.')
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'افزودن به سبد خرید ناموفق بود.')
    } finally {
      isAdding.value = false
    }
  }

  return { items, itemCount, isAdding, fetchCart, addItem }
})