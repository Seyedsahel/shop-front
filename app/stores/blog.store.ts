export const useBlogStore = defineStore('blog', () => {
  const items = ref<BlogPost[]>([])
  const current = ref<BlogPostDetail | null>(null)
  const isLoading = ref(false)
  const isDetailLoading = ref(false)
  const error = ref<ApiError | null>(null)

  async function fetchPosts(force = false) {
    if (items.value.length && !force) return
    isLoading.value = true
    error.value = null
    try {
      const res = await useApi().get<BlogPostsResponse>('/blogs')
      items.value = res.items
    } catch (e) {
      error.value = e instanceof ApiError ? e : new ApiError('خطا در دریافت مقالات.')
      useAppToast().error(error.value.message)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPost(slug: string) {
    if (current.value?.slug === slug) return current.value

    isDetailLoading.value = true
    error.value = null
    try {
      const post = await useApi().get<BlogPostDetail>(`/blogs/${encodeURIComponent(slug)}`)
      current.value = post
      const index = items.value.findIndex(item => item.id === post.id)
      const summary: BlogPost = {
        id: post.id,
        slug: post.slug,
        title: post.title,
        summary: post.summary,
        thumbnailUrl: post.thumbnailUrl,
        publishedAt: post.publishedAt,
      }
      if (index === -1) items.value.push(summary)
      else items.value.splice(index, 1, summary)
      return post
    } catch (e) {
      error.value = e instanceof ApiError ? e : new ApiError('خطا در دریافت مقاله.')
      throw e
    } finally {
      isDetailLoading.value = false
    }
  }

  return { items, current, isLoading, isDetailLoading, error, fetchPosts, fetchPost }
})
