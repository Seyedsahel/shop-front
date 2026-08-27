// definitions -> Definition State: What filters are available?
// values -> Selection State : What has the user selected?
export const useFilterStore = defineStore('filter', () => {
  const definitions = ref<FilterDefinition[]>([])
  const values = reactive<Record<string, FilterValue>>({})
  const isLoading = ref(false)

  async function fetchFilters() {
    if (definitions.value.length) return
    isLoading.value = true
    try {
      const res = await useApi().get<FiltersResponse>('/catalog/filters')
      definitions.value = res.items
      for (const filter of res.items) {
        if (values[filter.id] === undefined) {
          values[filter.id] = filter.type === 'checkbox' ? [] : filter.type === 'range' ? null : filter.type === 'toggle' ? false : null
        }
      }
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'خطا در دریافت فیلترها.')
    } finally {
      isLoading.value = false
    }
  }

  function setValue(id: string, value: FilterValue) {
  values[id] = value
  const productListStore = useProductListStore()
  productListStore.setPage(1)
  productListStore.refetch()
}

function resetAll() {
  for (const filter of definitions.value) {
    values[filter.id] = filter.type === 'checkbox' ? [] : filter.type === 'toggle' ? false : null
  }
  const productListStore = useProductListStore()
  productListStore.setPage(1)
  productListStore.refetch()
}

  const activeCount = computed(() =>
    Object.values(values).filter(v => v && (Array.isArray(v) ? v.length > 0 : true)).length
  )

  return { definitions, values, isLoading, activeCount, fetchFilters, setValue, resetAll }
})