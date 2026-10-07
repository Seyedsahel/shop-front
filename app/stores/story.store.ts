export const useStoryStore = defineStore('story', () => {
  const api = useApi()
  const items = ref<StoryItem[]>([])
  const isLoading = ref(false)
  const isDetailLoading = ref(false)
  const error = ref<ReturnType<typeof serializeApiError> | null>(null)
  const seenIds = ref<Set<string>>(new Set())
  const fetched = ref(false)
  let listRequest: Promise<boolean> | null = null
  let seenLoaded = false
  let detailRequest = 0
  let detailOwner: symbol | undefined
  function claimDetailOwner() { detailOwner = Symbol('story-detail'); detailRequest++; return detailOwner }
  function invalidateDetail(owner: symbol) {
    if (owner !== detailOwner) return
    detailRequest++
    isDetailLoading.value = false
    error.value = null
  }

  async function fetchStories(force = false) {
    if (fetched.value && !force) return true
    if (listRequest) return listRequest

    isLoading.value = true
    error.value = null
    listRequest = api.get<StoriesResponse>('/stories')
      .then((res) => {
        items.value = res.items
        fetched.value = true
        return true
      })
      .catch((cause) => {
        error.value = serializeApiError(cause, 'خطا در دریافت استوری‌ها.')
        return false
      })
      .finally(() => {
        isLoading.value = false
        listRequest = null
      })
    return listRequest
  }

  async function fetchStory(id: string, owner?: symbol) {
    if (owner && owner !== detailOwner) return
    const request = ++detailRequest
    error.value = null
    isDetailLoading.value = false
    const cached = items.value.find(item => item.id === id)
    if (cached) return cached

    isDetailLoading.value = true
    error.value = null
    try {
      const story = await api.get<StoryItem>(`/stories/${encodeURIComponent(id)}`)
      if (request !== detailRequest) return undefined
      const index = items.value.findIndex(item => item.id === story.id)
      if (index === -1) items.value.push(story)
      else items.value.splice(index, 1, story)
      return story
    } catch (cause) {
      if (request !== detailRequest) return undefined
      error.value = serializeApiError(cause, 'خطا در دریافت استوری.')
      throw cause
    } finally {
      if (request === detailRequest) isDetailLoading.value = false
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
      try { localStorage.removeItem('seen_stories') } catch {}
    }
  }

  function markSeen(id: string) {
    seenIds.value.add(id)
    persistSeenIds()
  }

  function persistSeenIds() {
    if (import.meta.client) { try { localStorage.setItem('seen_stories', JSON.stringify([...seenIds.value])) } catch {} }
  }

  function isSeen(id: string) {
    return seenIds.value.has(id)
  }

  return { items, isLoading, isDetailLoading, error, fetched, seenIds, claimDetailOwner, invalidateDetail, fetchStories, fetchStory, loadSeenFromStorage, markSeen, isSeen }
})
