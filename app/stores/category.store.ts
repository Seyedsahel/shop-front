export const useCategoryStore = defineStore('category', () =>{
  const api = useApi()
    const items = ref<ProductCategory[]>([])
    const isLoading = ref(false)
    const loaded = ref(false)
    const error = ref('')

    let pending: Promise<boolean> | undefined

    function fetchCategories(): Promise<boolean> {
        if (loaded.value) return Promise.resolve(true)
        if (pending) return pending
        pending = load().finally(() => { pending = undefined })
        return pending
    }

    async function load(): Promise<boolean> {
        isLoading.value = true
        error.value = ''
        try {
            const res = await api.get<CategoriesResponse>('/categories')
            items.value = res.items
            loaded.value = true
            return true
        } catch (e){
            error.value = e instanceof ApiError ? e.message : 'خطا در دریافت دسته بندی ها'
            return false
        } finally {
            isLoading.value = false
        }
    }

    return { items, isLoading, loaded, error, fetchCategories}
})
