import { authService } from "~/services/auth.services"

type AuthStep = 'phone' | 'otp'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    step: 'phone' as AuthStep,
    phone: '',
    isLoading: false,
    error: '',
    isAuthenticated: false,
    user: null as User | null,
  }),

  actions: {
    async requestOtp(phone: string) {
      this.isLoading = true
      this.error = ''
      try {
        await authService.requestOtp({ phone })
        this.phone = phone
        this.step = 'otp'
      } catch (e: any) {
        this.error = e.data?.message ?? 'خطا در ارسال کد، دوباره تلاش کنید.'
      } finally {
        this.isLoading = false
      }
    },

    async verifyOtp(code: string) {
      this.isLoading = true
      this.error = ''
      try {
        await authService.verifyOtp({ phone: this.phone, code })
        await this.fetchSession()
      } catch (e: any) {
        this.error = e.data?.message ?? 'کد وارد شده صحیح نیست.'
        throw e
      } finally {
        this.isLoading = false
      }
    },

    async fetchSession() {
      const res = await authService.getSession()
      this.isAuthenticated = res.isAuthenticated
      this.user = res.user ?? null
    },

    async logout() {
      await authService.logout()
      this.isAuthenticated = false
      this.user = null
      this.step = 'phone'
      this.phone = ''
    },

    goBackToPhone() {
      this.step = 'phone'
      this.error = ''
    }
  }
})