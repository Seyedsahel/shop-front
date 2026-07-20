<script setup lang="ts">
const authStore = useAuthStore()
const code = ref('')
const codeError = ref('')
const codeInput = ref()

function validateCode(value: string) {
  if (!value) return 'کد تایید را وارد کنید.'
  if (!/^\d{6}$/.test(value)) return 'کد باید ۶ رقم باشد.'
  return ''
}

const submit = async () => {
  codeInput.value?.validate()
  if (codeError.value) return
  try {
    await authStore.verifyOtp(code.value)
    await navigateTo('/')
  } catch {
    // toast already fired inside the store
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-8">
    <button type="button" @click="authStore.goBackToPhone" class="self-start">
      <UIcon name="solar:arrow-right-broken" class="size-6 text-accent-foreground" />
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
          class="w-full sm:w-auto bg-secondary hover:bg-secondary/80 disabled:opacity-50 border border-divider text-text-on-dark py-2 px-10 sm:px-20 rounded-xl transition-colors mt-2">
          {{ authStore.isLoading ? 'در حال بررسی...' : 'تایید' }}
        </button>
      </div>
    </form>
  </div>
</template>