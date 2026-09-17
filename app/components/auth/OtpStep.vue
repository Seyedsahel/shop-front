<script setup lang="ts">
const OTP_LENGTH = 4
const authStore = useAuthStore()
const digits = ref<string[]>(Array.from({ length: OTP_LENGTH }, () => ''))
const codeError = ref('')
const inputs = ref<HTMLInputElement[]>([])
const timeLeft = useCountdown(computed(() => authStore.otpRequestedAt))
const canResend = computed(() => timeLeft.expired)
const code = computed(() => digits.value.join(''))

function setInput(element: unknown, index: number) {
  if (element instanceof HTMLInputElement) inputs.value[index] = element
}

function validateCode(value: string) {
  if (value.length !== OTP_LENGTH) return 'کد تایید ۴ رقمی را وارد کنید.'
  if (!/^\d{4}$/.test(value)) return 'کد تایید معتبر نیست.'
  return ''
}

function onDigitInput(event: Event, index: number) {
  const value = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(-1)
  digits.value[index] = value
  if (codeError.value) codeError.value = validateCode(code.value)
  if (value && index < OTP_LENGTH - 1) inputs.value[index + 1]?.focus()
}

function onKeydown(event: KeyboardEvent, index: number) {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) inputs.value[index - 1]?.focus()
}

function onPaste(event: ClipboardEvent) {
  const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH) ?? ''
  if (!pasted) return
  event.preventDefault()
  digits.value = Array.from({ length: OTP_LENGTH }, (_, index) => pasted[index] ?? '')
  inputs.value[Math.min(pasted.length, OTP_LENGTH) - 1]?.focus()
}

async function submit() {
  codeError.value = validateCode(code.value)
  if (codeError.value) return
  try {
    await authStore.verifyOtp(code.value)
    await navigateTo(authStore.consumeReturnTo() ?? '/')
  } catch {
    // Store displays the normalized API error.
  }
}

async function handleResend() {
  digits.value = Array.from({ length: OTP_LENGTH }, () => '')
  codeError.value = ''
  await authStore.resendOtp()
  inputs.value[0]?.focus()
}
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between border-b border-divider pb-4">
       <span class="inline-flex items-center gap-1.5 rounded-full bg-success-subtle px-2.5 py-1 text-[11px] font-medium text-success"><UIcon name="solar:lock-keyhole-linear" class="size-3.5" />احراز هویت امن</span>
      <button type="button" class="inline-flex items-center gap-2 text-xs font-medium text-text-muted transition hover:text-primary" @click="authStore.goBackToPhone"><UIcon name="solar:arrow-right-linear" class="size-4" />بازگشت و تغییر شماره</button>
     
    </div>

    <div class="mb-8 text-center">
      <div class="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl border border-divider bg-surface text-primary"><UIcon name="solar:smartphone-linear" class="size-6" /></div>
      <h1 class="text-2xl font-bold tracking-tight text-text-primary">کد تایید را وارد کنید</h1>
      <p class="mt-3 text-sm leading-relaxed text-text-secondary">کد ۴ رقمی به شماره <span class="inline-block rounded-lg border border-divider bg-surface px-2 py-0.5 font-bold tracking-wider text-text-primary" dir="ltr"> +98 {{ authStore.phone }}</span> ارسال شد.</p>
    </div>

    <form class="space-y-6" novalidate @submit.prevent="submit">
      <div>
        <label class="mb-3 block text-center text-xs font-semibold text-text-muted">کد اعتبارسنجی پیامک شده</label>
        <div class="flex justify-center gap-2.5" dir="ltr" @paste="onPaste">
          <input v-for="(_, index) in digits" :key="index" :ref="element => setInput(element, index)" :value="digits[index]" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="1" :aria-label="`رقم ${index + 1} کد تایید`" class="size-14 rounded-xl border-2 bg-card text-center text-2xl font-bold text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-focus-ring/40" :class="codeError ? 'border-danger-border' : 'border-divider'" @input="onDigitInput($event, index)" @keydown="onKeydown($event, index)" />
        </div>
        <p v-if="codeError" class="mt-2 text-center text-xs text-danger">{{ codeError }}</p>
      </div>

      <div class="space-y-3 rounded-2xl border border-divider bg-surface/80 p-4 text-xs">
        <div class="flex items-center justify-between text-text-secondary"><span>مدت زمان اعتبار کد:</span><span v-if="!canResend" class="inline-flex items-center gap-1.5 rounded-full bg-warning-subtle px-3 py-1 font-semibold text-warning"><span class="size-2 animate-pulse rounded-full bg-warning" />{{ String(timeLeft.minutes).padStart(2, '0') }}:{{ String(timeLeft.seconds).padStart(2, '0') }}</span><span v-else class="text-text-muted">کد منقضی شده است</span></div>
        <div class="flex items-center justify-between border-t border-divider pt-3 text-text-muted"><span>کد را دریافت نکرده‌اید؟</span><button type="button" :disabled="!canResend || authStore.isLoading" class="font-medium text-primary transition enabled:hover:text-primary-hover disabled:cursor-not-allowed disabled:opacity-40" @click="handleResend">ارسال مجدد پیامک</button></div>
      </div>

      <button type="submit" :disabled="authStore.isLoading" class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground shadow-md transition hover:bg-primary-hover active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50"><span>{{ authStore.isLoading ? 'در حال بررسی...' : 'تایید و ورود به حساب' }}</span><UIcon name="solar:arrow-left-linear" class="size-5" /></button>
    </form>

    <p class="mt-7 flex items-center justify-center gap-1.5 border-t border-divider pt-4 text-center text-[11px] leading-relaxed text-text-muted"><UIcon name="solar:shield-check-linear" class="size-3.5 text-primary" />کد تایید یک‌بار مصرف است و برای حفظ حریم خصوصی شما ارسال شده است.</p>
  </div>
</template>
