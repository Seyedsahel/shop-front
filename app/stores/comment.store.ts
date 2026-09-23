export const useCommentStore = defineStore('comment', () => {
  const byTarget = ref<Record<string, AppComment[]>>({})
  const pendingByTarget = ref<Record<string, AppComment[]>>({})
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const authStore = useAuthStore()

  watch(() => authStore.user?.id, (userId, previousUserId) => {
    if (previousUserId && userId !== previousUserId) pendingByTarget.value = {}
  })
  watch(() => authStore.isAuthenticated, isAuthenticated => {
    if (!isAuthenticated) pendingByTarget.value = {}
  })

  function keyFor(targetType: CommentTargetType, targetId: string) {
    return `${targetType}:${targetId}`
  }

  async function fetchComments(targetType: CommentTargetType, targetId: string) {
    isLoading.value = true
    try {
      const res = await useApi().get<CommentsResponse>(`/engagement/comments?targetType=${targetType}&targetId=${targetId}`)
      byTarget.value[keyFor(targetType, targetId)] = res.items
      const approvedIds = new Set(res.items.map(comment => comment.id))
      pendingByTarget.value[keyFor(targetType, targetId)] = (pendingByTarget.value[keyFor(targetType, targetId)] ?? [])
        .filter(comment => !approvedIds.has(comment.id))
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'خطا در دریافت نظرات.')
    } finally {
      isLoading.value = false
    }
  }

  async function submitComment(targetType: CommentTargetType, targetId: string, content: string, parentId?: string) {
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
      const created = await useApi().post<CreatedCommentResponse>('/engagement/comments', {
        targetType, targetId, content: content.trim(), parentId,
      } satisfies SubmitCommentPayload)
      const key = keyFor(targetType, targetId)
      const comment: AppComment = {
        id: created.id,
        authorName: authStore.user?.name || 'شما',
        content: created.body,
        createdAt: new Date(created.created_at * 1000).toLocaleString('fa-IR'),
        parentId: created.parent_id,
        pending: !created.is_confirmed,
      }
      if (comment.pending) pendingByTarget.value[key] = [comment, ...(pendingByTarget.value[key] ?? [])]
      else byTarget.value[key] = [comment, ...(byTarget.value[key] ?? [])]
      useAppToast().success('نظر شما ثبت شد.')
      return true
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'ثبت نظر ناموفق بود.')
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  return { byTarget, pendingByTarget, isLoading, isSubmitting, keyFor, fetchComments, submitComment }
})
