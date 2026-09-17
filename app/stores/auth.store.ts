export const useAuthStore = defineStore('auth', () => {
  const step = ref<'phone' | 'otp'>('phone')
  const phone = ref('')
  const isLoading = ref(false)
  const isAuthenticated = ref(false)
  const user = ref<User | null>(null)
  const otpRequestedAt = ref<string | null>(null)
  const returnTo = ref<string | null>(null)

  async function requestOtp(value: string) {
    isLoading.value = true
    try {
      await useApi().post<RequestOtpResponse>('/auth/request-otp', { phone: value } satisfies RequestOtpPayload)
      phone.value = value
      step.value = 'otp'
      otpRequestedAt.value = new Date(Date.now() + 60_000).toISOString()
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'خطا در ارسال کد، دوباره تلاش کنید.')
    } finally {
      isLoading.value = false
    }
  }

  async function resendOtp() {
    await requestOtp(phone.value)
  }

  async function verifyOtp(code: string) {
    isLoading.value = true
    try {
      await useApi().post<VerifyOtpResponse>('/auth/verify-otp', { phone: phone.value, code } satisfies VerifyOtpPayload)

      // The verify endpoint sets the HttpOnly auth cookie. A profile cannot be
      // fetched until the backend provides /auth/me.
      isAuthenticated.value = true
      user.value = null
      useAppToast().success('ورود با موفقیت انجام شد.')
    } catch (e) {
      useAppToast().error(e instanceof ApiError ? e.message : 'کد وارد شده صحیح نیست.')
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function fetchSession() {
    // TODO(auth): This local session probe must call the backend /auth/me
    // endpoint when it becomes available.
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
    otpRequestedAt.value = null
  }

  
  function requireAuth(path: string) {
    returnTo.value = path
    navigateTo('/auth')
  }

  function consumeReturnTo(): string | null {
    const target = returnTo.value
    returnTo.value = null
    return target
  }

  return { step, phone, isLoading, isAuthenticated, user, otpRequestedAt,requestOtp, verifyOtp, resendOtp, fetchSession, logout, goBackToPhone, requireAuth, consumeReturnTo }
})
