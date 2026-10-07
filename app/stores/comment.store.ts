export const useCommentStore = defineStore('comment', () => {
  const api = useApi()
  const byTarget = ref<Record<string, AppComment[]>>({})
  const pendingByTarget = ref<Record<string, AppComment[]>>({})
  const isLoading = ref(false)
  const errors = ref<Record<string, string>>({})
  const pending = new Map<string, Promise<void>>()
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

  function fetchComments(targetType: CommentTargetType, targetId: string, force = false): Promise<void> {
    const key = keyFor(targetType, targetId)
    if (pending.has(key)) return pending.get(key)!
    if (!force && Object.hasOwn(byTarget.value, key)) return Promise.resolve()
    isLoading.value = true
    delete errors.value[key]
    const query = new URLSearchParams({ targetType, targetId })
    const request = api.get<CommentsResponse>(`/comments?${query}`)
      .then(res => {
        byTarget.value[key] = res.items
        const approvedIds = new Set(res.items.map(comment => comment.id))
        pendingByTarget.value[key] = (pendingByTarget.value[key] ?? []).filter(comment => !approvedIds.has(comment.id))
      })
      .catch(cause => { errors.value[key] = serializeApiError(cause, 'خطا در دریافت نظرات.').message })
      .finally(() => { pending.delete(key); isLoading.value = pending.size > 0 })
    pending.set(key, request)
    return request
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
      const created = await api.post<CreatedCommentResponse>('/comments', {
        targetType, targetId, content: content.trim(), parentId,
      } satisfies SubmitCommentPayload)
      const key = keyFor(targetType, targetId)
      const comment: AppComment = {
        id: created.id,
        authorName: authStore.user?.name || 'شما',
        content: created.body,
        createdAt: new Date(created.created_at * 1000).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' }),
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

  return { byTarget, pendingByTarget, errors, isLoading, isSubmitting, keyFor, fetchComments, submitComment }
})
