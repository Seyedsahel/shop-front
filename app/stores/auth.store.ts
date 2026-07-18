type AuthStep = 'phone' | 'otp'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    step: 'phone' as AuthStep,
    phone: '',
    isLoading: false,
    error: '' as string,
    isAuthenticated: false,
    user: null as User | null,
  }),

  actions: {
    async requestOtp(phone: string) {
      this.isLoading = true
      this.error = ''
      try {
        await $fetch('/api/auth/request-otp', { method: 'POST', body: { phone } })
        this.phone = phone
        this.step = 'otp'
      } catch (e: any) {
        this.error = 'خطا در ارسال کد، دوباره تلاش کنید.'
      } finally {
        this.isLoading = false
      }
    },

  
    async verifyOtp(code: string) {
      this.isLoading = true
      this.error = ''
      try {
        await $fetch<VerifyOtpResponse>('/api/auth/verify-otp', {
          method: 'POST',
          body: { phone: this.phone, code }
        })
        await this.fetchSession()
        // cookie is already set by the server response — nothing to store here
      } catch (e: any) {
        this.error = e.data?.message ?? 'کد وارد شده صحیح نیست.'
        throw e
      } finally {
        this.isLoading = false
      }
    },

    goBackToPhone() {
      this.step = 'phone'
      this.error = ''
    },
    async fetchSession(){
      const res = await $fetch<{ isAuthenticated: boolean, user?: User }>('/api/auth/me')
      this.isAuthenticated = res.isAuthenticated
      this.user = res.user ?? null
    },
  }
})