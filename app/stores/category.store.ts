export const useCategoryStore = defineStore('category', () =>{
    const items = ref<ProductCategory[]>([])
    const isLoading = ref(false)

    async function fetchCategories() {
        if (items.value.length) return
        isLoading.value = true
        try {
            const res = await useApi().get<CategoriesResponse>('/catalog/categories')
            items.value = res.items
        } catch (e){
            useAppToast().error(e instanceof ApiError ? e.message : 'خطا در دریافت دسته بندی ها')
        } finally {
            isLoading.value = false
        }
    }

    return { items, isLoading, fetchCategories}
})