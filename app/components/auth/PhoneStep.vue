<!-- components/auth/PhoneStep.vue -->
<script setup lang="ts">
const authStore = useAuthStore()
const phone = ref('')
const validationError = ref('')
const phoneInput = ref()

const submit = async () => {
  phoneInput.value?.validate()
  if (validationError.value) return
  await authStore.requestOtp(phone.value)
}
</script>

<template>
  <div class="flex flex-col items-center gap-8">
    <h1 class="text-text-primary text-lg sm:text-xl font-semibold">ثبت نام یا ورود</h1>
    <form class="w-full" @submit.prevent="submit" novalidate>
      <div class="flex flex-col items-center gap-3 w-full">
        <UiPhoneInput ref="phoneInput" v-model="phone" v-model:error="validationError" />
        <p v-if="authStore.error" class="text-danger text-xs self-start">{{ authStore.error }}</p>
        <button type="submit" :disabled="authStore.isLoading"
          class="w-full sm:w-auto bg-secondary hover:bg-secondary/80 disabled:opacity-50 border border-divider text-text-on-dark py-2 px-10 sm:px-20 rounded-xl transition-colors mt-2">
          {{ authStore.isLoading ? 'در حال ارسال...' : 'ادامه' }}
        </button>
      </div>
    </form>
  </div>
</template>