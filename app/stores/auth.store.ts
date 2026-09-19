export const useAuthStore = defineStore('auth', () => {
  const step = ref<'phone' | 'otp'>('phone')
  const phone = ref('')
  const isLoading = ref(false)
  const isAuthenticated = ref(false)
  const user = ref<User | null>(null)
  const sessionChecked = ref(false)
  const otpRequestedAt = ref<string | null>(null)
  const returnTo = ref<string | null>(null)
  const identity = ref<string | null>(null)
  const hasGuestSession = ref(false)
  const sessionRevision = ref(0)
  let sessionQueue: Promise<unknown> = Promise.resolve()
  let guestRequest: Promise<SessionResponse> | null = null

  // Per-store serialization also works on SSR without sharing visitors' state.
  // Web Locks coordinate cookie mutations between tabs where supported.
  function withSessionLock<T>(action: () => Promise<T>): Promise<T> {
    const run = () => import.meta.client && navigator.locks
      ? navigator.locks.request('shop-session', action)
      : action()
    const result = sessionQueue.then(run, run)
    sessionQueue = result.catch(() => {})
    return result
  }

  function applySession(session: SessionResponse) {
    identity.value = session.identity
    isAuthenticated.value = session.isAuthenticated
    hasGuestSession.value = session.hasGuestSession
    user.value = session.user ?? null
    sessionChecked.value = true
    sessionRevision.value++
  }

  function handleSessionError(code?: string) {
    if (code === 'AUTH_SESSION_EXPIRED') {
      applySession({ identity: null, isAuthenticated: false, hasGuestSession: false })
    } else if (code === 'GUEST_SESSION_EXPIRED' && !isAuthenticated.value) {
      applySession({ identity: null, isAuthenticated: false, hasGuestSession: false })
    }
  }

  function ensureShoppingSession(): Promise<SessionResponse> {
    if (import.meta.server) throw new Error('Create shopping sessions from a client cart action')
    if (guestRequest) return guestRequest
    guestRequest = withShoppingSession(true, async session => session)
      .finally(() => { guestRequest = null })
    return guestRequest
  }

  function withShoppingSession<T>(create: boolean, action: (session: SessionResponse) => Promise<T>): Promise<T> {
    if (import.meta.server) throw new Error('Shopping actions must run on the client')
    const api = useApi()
    return withSessionLock(async () => {
      const session = create
        ? await api.post<SessionResponse>('/auth/guest')
        : await api.get<SessionResponse>('/auth/me')
      applySession(session)
      return action(session)
    })
  }

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
    const api = useApi()
    const toast = useAppToast()
    isLoading.value = true
    try {
      await withSessionLock(async () => {
        await api.post<VerifyOtpResponse>('/auth/verify-otp', { phone: phone.value, code } satisfies VerifyOtpPayload)
        identity.value = null
        hasGuestSession.value = false
        sessionRevision.value++
        const session = await api.get<SessionResponse>('/auth/me')
        applySession(session)
        if (!session.isAuthenticated) throw new ApiError('ورود تأیید نشد، دوباره تلاش کنید.', 401)
      })
      toast.success('ورود با موفقیت انجام شد.')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'کد وارد شده صحیح نیست.')
      throw e
    } finally {
      isLoading.value = false
    }
  }

  function fetchSession() {
    const api = useApi()
    return withSessionLock(async () => {
      // Network failures do not prove that an existing session is invalid.
      const session = await api.get<SessionResponse>('/auth/me')
      applySession(session)
      return session
    })
  }

  async function logout() {
    const api = useApi()
    const toast = useAppToast()
    try {
      await withSessionLock(async () => {
        await api.post('/auth/logout')
        applySession({ identity: null, isAuthenticated: false, hasGuestSession: false })
        step.value = 'phone'
        phone.value = ''
        otpRequestedAt.value = null
      })
      toast.success('با موفقیت خارج شدید.')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'خطا در خروج از حساب.')
    }
  }

  function goBackToPhone() {
    step.value = 'phone'
    otpRequestedAt.value = null
  }

  
  function requireAuth(path: string) {
    returnTo.value = path
    navigateTo({ path: '/auth', query: { redirect: path } })
  }

  function consumeReturnTo(): string | null {
    const redirect = useRoute().query.redirect
    const target = returnTo.value ?? (typeof redirect === 'string' && redirect.startsWith('/') ? redirect : null)
    returnTo.value = null
    return target
  }

  return { identity, withShoppingSession, hasGuestSession, sessionRevision, ensureShoppingSession, handleSessionError, step, phone, isLoading, isAuthenticated, user, sessionChecked, otpRequestedAt, requestOtp, verifyOtp, resendOtp, fetchSession, logout, goBackToPhone, requireAuth, consumeReturnTo }
})
