export function useSort() {
  const route = useRoute()
  const router = useRouter()

  const activeSort = computed(() => (route.query.sort as string) ?? sortOptions[0]?.id)

  function setSort(id: string) {
    router.replace({ query: { ...route.query, sort: id } })
  }

  return { activeSort, setSort }
}