export const useAuthStore = defineStore('auth', () => {
  const step = ref<'phone' | 'otp'>('phone')
  const phone = ref('')
  const isLoading = ref(false)
  const isAuthenticated = ref(false)
  const user = ref<User | null>(null)

  async function requestOtp(value: string) {
    isLoading.value = true
    try {
      await useApi().post<VerifyOtpResponse>('/auth/request-otp', { phone: value } satisfies RequestOtpPayload)
      phone.value = value
      step.value = 'otp'
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'خطا در ارسال کد، دوباره تلاش کنید.')
    } finally {
      isLoading.value = false
    }
  }

  async function verifyOtp(code: string) {
    isLoading.value = true
    try {
      await useApi().post<VerifyOtpResponse>('/auth/verify-otp', { phone: phone.value, code } satisfies VerifyOtpPayload)
      await fetchSession()
      useAppToast().success('ورود با موفقیت انجام شد.')
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'کد وارد شده صحیح نیست.')
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function fetchSession() {
    const res = await useApi().get<SessionResponse>('/auth/me')
    isAuthenticated.value = res.isAuthenticated
    user.value = res.user ?? null
  }

  async function logout() {
    try {
      await useApi().post('/auth/logout')
      isAuthenticated.value = false
      user.value = null
      step.value = 'phone'
      phone.value = ''
      useAppToast().success('با موفقیت خارج شدید.')
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'خطا در خروج از حساب.')
    }
  }

  function goBackToPhone() {
    step.value = 'phone'
  }

  return { step, phone, isLoading, isAuthenticated, user, requestOtp, verifyOtp, fetchSession, logout, goBackToPhone }
})