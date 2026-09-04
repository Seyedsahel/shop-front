export const useFilterStore = defineStore('filter', () => {
  const definitions = ref<FilterDefinition[]>([])
  const values = reactive<Record<string, FilterValue>>({})
  const isLoading = ref(false)

  async function fetchFilters(categoryIds?: string[]) {
    isLoading.value = true
    try {
      const res = await useApi().post<FiltersResponse>('/catalog/filters', { category_ids: categoryIds })
      definitions.value = res.items
      for (const filter of res.items) {
        if (values[filter.slug] === undefined) {
          values[filter.slug] = filter.dataType === 'multiselect' ? [] : filter.dataType === 'boolean' ? null : null
        }
      }
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'خطا در دریافت فیلترها.')
    } finally {
      isLoading.value = false
    }
  }

  function setValue(slug: string, value: FilterValue) {
    values[slug] = value
    useProductListStore().refetch()
  }

  function resetAll() {
    for (const filter of definitions.value) {
      values[filter.slug] = filter.dataType === 'multiselect' ? [] : null
    }
    useProductListStore().refetch()
  }

  const activeCount = computed(() =>
    Object.values(values).filter(v => v !== null && v !== false && !(Array.isArray(v) && v.length === 0)).length
  )

  // Converts current values into the backend's attribute_fields shape —
  // every filter (select/string/multiselect/boolean) becomes a string[]
  // keyed by slug, since that's the one shape the backend accepts for all of them.
  function toAttributeFields(): Record<string, string[]> {
    const fields: Record<string, string[]> = {}
    for (const [slug, value] of Object.entries(values)) {
      if (value === null || value === undefined) continue
      if (Array.isArray(value) && value.length) fields[slug] = value
      else if (typeof value === 'string' && value) fields[slug] = [value]
    }
    return fields
  }

  return { definitions, values, isLoading, activeCount, fetchFilters, setValue, resetAll, toAttributeFields }
})