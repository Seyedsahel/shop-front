export const useCategoryStore = defineStore('category', () =>{
    const items = ref<ProductCategory[]>([])
    const isLoading = ref(false)

    let pending: Promise<boolean> | undefined

    function fetchCategories(): Promise<boolean> {
        if (items.value.length) return Promise.resolve(true)
        if (pending) return pending
        pending = load().finally(() => { pending = undefined })
        return pending
    }

    async function load(): Promise<boolean> {
        isLoading.value = true
        try {
            const res = await useApi().get<CategoriesResponse>('/categories')
            items.value = res.items
            return true
        } catch (e){
            useAppToast().error(e instanceof ApiError ? e.message : 'خطا در دریافت دسته بندی ها')
            return false
        } finally {
            isLoading.value = false
        }
    }

    return { items, isLoading, fetchCategories}
})
