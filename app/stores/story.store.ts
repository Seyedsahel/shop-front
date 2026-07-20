export const useStoryStore = defineStore('story', () => {
  const items = ref<StoryItem[]>([])
  const isLoading = ref(false)
  const seenIds = ref<Set<string>>(new Set())

  async function fetchStories() {
    isLoading.value = true
    try {
      const res = await useApi().get<StoriesResponse>('/engagement/stories')
      items.value = res.items
      loadSeenFromStorage()
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'خطا در دریافت استوری‌ها.')
    } finally {
      isLoading.value = false
    }
  }

  function loadSeenFromStorage() {
    if (import.meta.client) {
      const raw = localStorage.getItem('seen_stories')
      seenIds.value = raw ? new Set(JSON.parse(raw)) : new Set()
    }
  }

  function markSeen(id: string) {
    seenIds.value.add(id)
    if (import.meta.client) {
      localStorage.setItem('seen_stories', JSON.stringify([...seenIds.value]))
    }
  }

  function isSeen(id: string) {
    return seenIds.value.has(id)
  }

  return { items, isLoading, seenIds, fetchStories, loadSeenFromStorage, markSeen, isSeen }
})