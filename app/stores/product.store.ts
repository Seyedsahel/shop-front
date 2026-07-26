export const useProductStore = defineStore('product', () => {
  const byCategory = ref<Record<string, Product[]>>({})
  const isLoading = ref(false)

  async function fetchByCategory(category: string) {
    isLoading.value = true
    try {
      const res = await useApi().get<ProductsResponse>(`/catalog/products?category=${category}`)
      byCategory.value[category] = res.items
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'خطا در دریافت محصولات.')
    } finally {
      isLoading.value = false
    }
  }

  return { byCategory, isLoading, fetchByCategory }
})