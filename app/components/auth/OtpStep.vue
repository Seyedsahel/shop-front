<!-- components/auth/OtpStep.vue -->
<script setup lang="ts">
const authStore = useAuthStore()
const code = ref('')

const submit = async () => {
  try {
    await authStore.verifyOtp(code.value)
    await navigateTo('/') // or wherever post-login goes
  } catch {
    // error already set in store
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-8">
    <button @click="authStore.goBackToPhone" class="self-start">
      <UIcon name="solar:arrow-right-broken" class="size-6 text-accent-foreground" />
    </button>
    <h1 class="text-text-primary text-lg sm:text-xl font-semibold">کد تایید را وارد کنید</h1>
    <p class="text-sm text-text-secondary">کد به شماره {{ authStore.phone }} ارسال شد.</p>

    <form class="w-full" @submit.prevent="submit" novalidate>
      <div class="flex flex-col items-center gap-3 w-full">
        <input v-model="code" type="text" inputmode="numeric" maxlength="6"
          class="border border-border-strong rounded-xl w-full py-2 px-4 text-center text-text-primary tracking-widest outline-none" />
        <p v-if="authStore.error" class="text-danger text-xs self-start">{{ authStore.error }}</p>
        <button type="submit" :disabled="authStore.isLoading"
          class="w-full sm:w-auto bg-secondary hover:bg-secondary/80 disabled:opacity-50 border border-divider text-text-on-dark py-2 px-10 sm:px-20 rounded-xl transition-colors mt-2">
          {{ authStore.isLoading ? 'در حال بررسی...' : 'تایید' }}
        </button>
      </div>
    </form>
  </div>
</template>