export const useConsultationStore = defineStore('consultation', () => {
  const notice = ref<string[]>([])
  const questions = ref<ConsultationQuestion[]>([])
  const answers = reactive<Record<string, string>>({})
  const description = ref('')
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const noticeLoaded = ref(false)
  const noticeError = ref('')
  const questionsLoaded = ref(false)
  const questionsError = ref('')

  async function fetchNotice() {
    if (noticeLoaded.value) return
    noticeError.value = ''
    try {
      const res = await useApi().get<ConsultationNoticeResponse>('/booking/consultation-notice')
      notice.value = res.items
      noticeLoaded.value = true
    } catch (cause) {
      noticeError.value = cause instanceof ApiError ? cause.message : 'دریافت نکات مشاوره ناموفق بود.'
    }
  }

  async function fetchQuestions() {
    if (questionsLoaded.value || isLoading.value) return
    isLoading.value = true
    questionsError.value = ''
    try {
      const res = await useApi().get<ConsultationQuestionsResponse>('/booking/consultation-questions')
      questions.value = res.items
      for (const q of res.items) {
        answers[q.id] = ''
      }
      questionsLoaded.value = true
    } catch (cause) {
      questionsError.value = cause instanceof ApiError ? cause.message : 'دریافت سوالات مشاوره ناموفق بود.'
    } finally {
      isLoading.value = false
    }
  }

  function validate(): boolean {
    if (!questionsLoaded.value || questionsError.value || isLoading.value) return false
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

  return { notice, noticeLoaded, noticeError, questions, questionsLoaded, questionsError, answers, description, isLoading, isSubmitting, fetchNotice, fetchQuestions, submit }
})
