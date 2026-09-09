<script setup lang="ts">
const authStore = useAuthStore()
const code = ref('')
const codeError = ref('')
const codeInput = ref()

const timeLeft = useCountdown(computed(() => authStore.otpRequestedAt))
const canResend = computed(() => timeLeft.expired)

function validateCode(value: string) {
  if (!value) return 'کد تایید را وارد کنید.'
  if (!/^\d{4,6}$/.test(value)) return 'کد معتبر نیست.'
  return ''
}

const submit = async () => {
  codeInput.value?.validate()
  if (codeError.value) return
  try {
    await authStore.verifyOtp(code.value)
    await navigateTo(authStore.consumeReturnTo() ?? '/')
  } catch {
    // toast already fired inside the store
  }
}

async function handleResend(){
  await authStore.resendOtp()
}
</script>

<template>
  <div class="flex flex-col items-center gap-8">
    <button type="button" @click="authStore.goBackToPhone" class="self-start">
      <UIcon name="solar:arrow-right-broken" class="size-6 text-text-primary" />
    </button>
    <h1 class="text-text-primary text-lg sm:text-xl font-semibold">کد تایید را وارد کنید</h1>
    <p class="text-sm text-text-secondary">کد به شماره {{ authStore.phone }} ارسال شد.</p>

    <form class="w-full" @submit.prevent="submit" novalidate>
      <div class="flex flex-col items-center gap-3 w-full">
        <UiInput
          ref="codeInput"
          v-model="code"
          v-model:error="codeError"
          inputmode="numeric"
          :maxlength="6"
          centered
          :validate="validateCode"
        />
        <button type="submit" :disabled="authStore.isLoading"
          class="w-full sm:w-auto bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground py-2 px-10 sm:px-20 rounded-xl transition-colors mt-2">
          {{ authStore.isLoading ? 'در حال بررسی...' : 'تایید' }}
        </button>
      </div>
    </form>
    <div class="text-sm text-text-secondary">
      <span v-if="!canResend">
        ارسال مجدد کد تا 
        <span class="tabular-nums font-medium text-text-primary">
          {{ String(timeLeft.minutes).padStart(2, '0') }}:{{ String(timeLeft.seconds).padStart(2, '0') }}
        </span>
      </span>
      <button
       v-else 
       type="button" 
       @click="handleResend" 
       class="text-primary font-medium"
       :disabled="authStore.isLoading">
       ارسال مجدد
      </button>

    </div>
  </div>
</template>