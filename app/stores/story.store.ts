// Loading -> API -> State -> Toast -> Loading=false

export const useStoryStore = defineStore('story', () => {
  const items = ref<StoryItem[]>([])
  const isLoading = ref(false)
  const isDetailLoading = ref(false)
  const error = ref<ApiError | null>(null)
  const seenIds = ref<Set<string>>(new Set())
  const fetched = ref(false)
  let listRequest: Promise<void> | null = null
  let seenLoaded = false

  async function fetchStories(force = false) {
    if (fetched.value && !force) return
    if (listRequest) return listRequest

    isLoading.value = true
    error.value = null
    listRequest = useApi().get<StoriesResponse>('/engagement/stories')
      .then((res) => {
        items.value = res.items
        fetched.value = true
        loadSeenFromStorage()
        pruneSeenIds()
      })
      .catch((cause) => {
        error.value = cause instanceof ApiError ? cause : new ApiError('خطا در دریافت استوری‌ها.')
        useAppToast().error(error.value.message)
      })
      .finally(() => {
        isLoading.value = false
        listRequest = null
      })
    return listRequest
  }

  async function fetchStory(id: string) {
    const cached = items.value.find(item => item.id === id)
    if (cached) return cached

    isDetailLoading.value = true
    error.value = null
    try {
      const story = await useApi().get<StoryItem>(`/engagement/stories/${encodeURIComponent(id)}`)
      const index = items.value.findIndex(item => item.id === story.id)
      if (index === -1) items.value.push(story)
      else items.value.splice(index, 1, story)
      return story
    } catch (cause) {
      error.value = cause instanceof ApiError ? cause : new ApiError('خطا در دریافت استوری.')
      throw cause
    } finally {
      isDetailLoading.value = false
    }
  }

  function loadSeenFromStorage() {
    if (!import.meta.client || seenLoaded) return
    seenLoaded = true
    try {
      const raw = localStorage.getItem('seen_stories')
      const parsed: unknown = raw ? JSON.parse(raw) : []
      seenIds.value = new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [])
    } catch {
      seenIds.value = new Set()
      localStorage.removeItem('seen_stories')
    }
  }

  function markSeen(id: string) {
    seenIds.value.add(id)
    persistSeenIds()
  }

  function pruneSeenIds() {
    const availableIds = new Set(items.value.map(item => item.id))
    seenIds.value = new Set([...seenIds.value].filter(id => availableIds.has(id)))
    persistSeenIds()
  }

  function persistSeenIds() {
    if (import.meta.client) localStorage.setItem('seen_stories', JSON.stringify([...seenIds.value]))
  }

  function isSeen(id: string) {
    return seenIds.value.has(id)
  }

  return { items, isLoading, isDetailLoading, error, seenIds, fetchStories, fetchStory, loadSeenFromStorage, markSeen, isSeen }
})
