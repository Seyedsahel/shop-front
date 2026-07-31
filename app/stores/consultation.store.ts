export const useConsultationStore = defineStore('consultation', () => {
  const notice = ref<string[]>([])
  const questions = ref<ConsultationQuestion[]>([])
  const answers = reactive<Record<string, string>>({})
  const description = ref('')
  const isLoading = ref(false)
  const isSubmitting = ref(false)

  async function fetchNotice() {
    if (notice.value.length) return
    const res = await useApi().get<ConsultationNoticeResponse>('/booking/consultation-notice')
    notice.value = res.items
  }

  async function fetchQuestions() {
    if (questions.value.length) return
    isLoading.value = true
    try {
      const res = await useApi().get<ConsultationQuestionsResponse>('/booking/consultation-questions')
      questions.value = res.items
      for (const q of res.items) {
        answers[q.id] = ''
      }
    } finally {
      isLoading.value = false
    }
  }

  function validate(): boolean {
    if (!description.value.trim()) return false
    return questions.value
      .filter(q => q.required)
      .every(q => (answers[q.id] ?? '').trim().length > 0)
  }

  async function submit() {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      authStore.requireAuth('/consultation')
      return false
    }

    if (!validate()) {
      useAppToast().error('لطفا به سوالات الزامی پاسخ دهید.')
      return false
    }

    isSubmitting.value = true
    try {
      const payload: SubmitConsultationPayload = {
        answers: questions.value.map(q => ({ questionId: q.id, value: answers[q.id] ?? '' })),
        description: description.value,
      }
      await useApi().post<SubmitConsultationResponse>('/booking/consultation-request', payload)
      useAppToast().success('درخواست مشاوره شما ثبت شد.')
      return true
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'ثبت درخواست ناموفق بود.')
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  return { notice, questions, answers, description, isLoading, isSubmitting, fetchNotice, fetchQuestions, submit }
})