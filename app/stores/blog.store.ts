export const useBlogStore = defineStore('blog', () => {
  const items = ref<BlogPost[]>([])
  const isLoading = ref(false)

  async function fetchPosts() {
    if (items.value.length) return
    isLoading.value = true
    try {
      const res = await useApi().get<BlogPostsResponse>('/content/blog-posts')
      items.value = res.items
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'خطا در دریافت مقالات.')
    } finally {
      isLoading.value = false
    }
  }

  return { items, isLoading, fetchPosts }
})