export const useCartStore = defineStore('cart', () => {
  const isAdding = ref(false)

  async function addItem(productId: string, quantity = 1) {
    isAdding.value = true
    try {
      await useApi().post('/ordering/cart/items', { productId, quantity } satisfies AddCartItemPayload)
      useAppToast().success('محصول به سبد خرید اضافه شد.')
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'افزودن به سبد خرید ناموفق بود.')
    } finally {
      isAdding.value = false
    }
  }

  return { isAdding, addItem }
})