<script setup lang="ts">
const authStore = useAuthStore()
const phone = ref('')
const validationError = ref('')

function normalizePhone(value: string) {
  return value
    .replace(/[۰-۹]/g, digit => '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit).toString())
    .replace(/[٠-٩]/g, digit => '٠١٢٣٤٥٦٧٨٩'.indexOf(digit).toString())
    .replace(/\D/g, '')
    .slice(0, 11)
}

function validatePhone(value: string) {
  if (!value) return 'شماره تماس الزامی است.'
  if (!/^9\d{9}$/.test(value)) return 'شماره تماس معتبر نیست.'
  return ''
}

function onPhoneInput(event: Event) {
  phone.value = normalizePhone((event.target as HTMLInputElement).value)
  if (validationError.value) validationError.value = validatePhone(phone.value)
}

async function submit() {
  validationError.value = validatePhone(phone.value)
  if (validationError.value) return
  await authStore.requestOtp(phone.value)
}
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <NuxtLink to="/" class="flex size-9 items-center justify-center rounded-xl text-text-secondary transition hover:border hover:border-divider hover:bg-surface hover:text-text-primary" aria-label="بازگشت به سایت"><UIcon name="solar:arrow-right-broken" class="size-5" /></NuxtLink>
      <div class="inline-flex items-center gap-2 rounded-full border border-divider bg-surface px-3 py-1.5 text-[11px] font-medium text-text-secondary"><span class="size-1.5 rounded-full bg-primary" />ورود امن به حامی دارو</div>
      
    </div>

    <div class="mb-8 space-y-2 text-center sm:text-right">
      <h1 class="text-2xl font-extrabold tracking-tight text-text-primary">ورود یا ثبت‌نام</h1>
      <p class="text-sm leading-relaxed text-text-muted">برای ورود به حساب کاربری یا عضویت در حامی دارو، شماره موبایل خود را وارد نمایید.</p>
    </div>

    <form class="space-y-6" novalidate @submit.prevent="submit">
      <div class="space-y-2">
        <div class="flex items-center justify-between"><label for="auth-phone" class="text-xs font-semibold text-text-secondary">شماره موبایل</label><span class="text-[11px] text-text-muted">نمونه: ۹۱۲۳۴۵۶۷۸۹</span></div>
        <div class="flex items-center rounded-xl border bg-surface/40 transition focus-within:border-primary focus-within:bg-card focus-within:ring-2 focus-within:ring-focus-ring/40" :class="validationError ? 'border-danger-border' : 'border-divider'">
          <input id="auth-phone" :value="phone" type="tel" name="phone" autocomplete="tel" inputmode="tel" maxlength="10" placeholder="9xxxxxxxxx" class="w-full bg-transparent px-4 py-3 text-left text-base font-medium tracking-wider text-text-primary outline-none placeholder:text-text-muted" dir="ltr" @input="onPhoneInput" @blur="validationError = validatePhone(phone)" />
          <div class="flex shrink-0 items-center gap-1.5 border-r border-divider px-3 py-1 text-xs font-semibold text-text-secondary" dir="ltr"><span>🇮🇷</span><span class="text-text-muted">+98</span></div>
        </div>
        <p v-if="validationError" class="text-xs text-danger">{{ validationError }}</p>
        <p v-else class="flex items-center gap-1.5 pt-1 text-[11px] text-text-muted"><UIcon name="solar:info-circle-linear" class="size-3.5 text-success" />کد تایید یک‌بار مصرف از طریق پیامک ارسال خواهد شد.</p>
      </div>

      <button type="submit" :disabled="authStore.isLoading" class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-md transition hover:bg-primary-hover active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50"><span>{{ authStore.isLoading ? 'در حال ارسال...' : 'ادامه و دریافت کد تایید' }}</span><UIcon name="solar:arrow-left-linear" class="size-4" /></button>
    </form>

    <p class="mt-8 border-t border-divider pt-6 text-center text-[11px] leading-relaxed text-text-muted">با ورود و استفاده از خدمات حامی دارو، شرایط و قوانین استفاده و حریم خصوصی را می‌پذیرید.</p>
  </div>
</template>
