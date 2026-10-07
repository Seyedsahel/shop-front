export const useBlogStore = defineStore('blog', () => {
  const api = useApi()
  const items = ref<BlogPost[]>([])
  const current = ref<BlogPostDetail | null>(null)
  const isLoading = ref(false)
  const isDetailLoading = ref(false)
  const loaded = ref(false)
  const error = ref<ReturnType<typeof serializeApiError> | null>(null)
  const detailError = ref<ReturnType<typeof serializeApiError> | null>(null)
  let pending: Promise<boolean> | null = null
  let detailRequest = 0
  let detailOwner: symbol | undefined
  function claimDetailOwner() { detailOwner = Symbol('detail'); detailRequest++; return detailOwner }

  function fetchPosts(force = false): Promise<boolean> {
    if (loaded.value && !force) return Promise.resolve(true)
    if (pending) return pending
    isLoading.value = true
    error.value = null
    pending = api.get<BlogPostsResponse>('/blogs').then(res => {
      items.value = res.items
      loaded.value = true
      return true
    }).catch(cause => {
      error.value = serializeApiError(cause, 'خطا در دریافت مقالات.')
      return false
    }).finally(() => { isLoading.value = false; pending = null })
    return pending
  }

  async function fetchPost(slug: string, owner?: symbol) {
    if (owner && owner !== detailOwner) return
    const request = ++detailRequest
    current.value = null
    isDetailLoading.value = true
    detailError.value = null
    try {
      const post = await api.get<BlogPostDetail>(`/blogs/${encodeURIComponent(slug)}`)
      if (request !== detailRequest) return null
      current.value = post
      return post
    } catch (cause) {
      if (request !== detailRequest) return null
      detailError.value = serializeApiError(cause, 'خطا در دریافت مقاله.')
      throw cause
    } finally {
      if (request === detailRequest) isDetailLoading.value = false
    }
  }

  function invalidateDetail(owner?: symbol) { if (owner && owner !== detailOwner) return; detailRequest++; current.value = null; isDetailLoading.value = false }
  return { items, current, loaded, isLoading, isDetailLoading, error, detailError, fetchPosts, fetchPost, invalidateDetail, claimDetailOwner }
})
