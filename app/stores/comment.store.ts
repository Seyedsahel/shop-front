export const useCommentStore = defineStore('comment', () => {
  const byTarget = ref<Record<string, AppComment[]>>({})
  const isLoading = ref(false)
  const isSubmitting = ref(false)

  function keyFor(targetType: CommentTargetType, targetId: string) {
    return `${targetType}:${targetId}`
  }

  async function fetchComments(targetType: CommentTargetType, targetId: string) {
    isLoading.value = true
    try {
      const res = await useApi().get<CommentsResponse>(`/engagement/comments?targetType=${targetType}&targetId=${targetId}`)
      byTarget.value[keyFor(targetType, targetId)] = res.items
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'خطا در دریافت نظرات.')
    } finally {
      isLoading.value = false
    }
  }

  async function submitComment(targetType: CommentTargetType, targetId: string, content: string) {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      authStore.requireAuth(useRoute().fullPath)
      return false
    }
    if (!content.trim()) {
      useAppToast().error('متن نظر نمی‌تواند خالی باشد.')
      return false
    }

    isSubmitting.value = true
    try {
      await useApi().post('/engagement/comments', { targetType, targetId, content } satisfies SubmitCommentPayload)
      useAppToast().success('نظر شما ثبت شد.')
      await fetchComments(targetType, targetId)
      return true
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'ثبت نظر ناموفق بود.')
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  return { byTarget, isLoading, isSubmitting, keyFor, fetchComments, submitComment }
})