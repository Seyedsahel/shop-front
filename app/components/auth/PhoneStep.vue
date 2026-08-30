<script setup lang="ts">
const authStore = useAuthStore()
const phone = ref('')
const validationError = ref('')
const phoneInput = ref()

function validatePhone(value: string) {
  if (!value) return 'شماره تماس الزامی است.'
  if (!/^09\d{9}$/.test(value)) return 'شماره تماس معتبر نیست.'
  return ''
}

const submit = async () => {
  phoneInput.value?.validate()
  if (validationError.value) return
  await authStore.requestOtp(phone.value)
}
</script>

<template>
  <div class="flex flex-col items-center gap-8">
    <NuxtLink to="/" class="self-start">
      <UIcon name="solar:arrow-right-broken" class="size-6 text-text-primary" />
    </NuxtLink>
    <h1 class="text-text-primary text-lg sm:text-xl font-semibold">ثبت نام یا ورود</h1>
    <form class="w-full" @submit.prevent="submit" novalidate>
      <div class="flex flex-col items-center gap-3 w-full">
        <UiInput
          ref="phoneInput"
          v-model="phone"
          v-model:error="validationError"
          type="tel"
          label="لطفا شماره تلفن خود را وارد کنید."
          placeholder="09xxxxxxxxx"
          :validate="validatePhone"
        />
        <button type="submit" :disabled="authStore.isLoading"
          class="w-full sm:w-auto bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground py-2 px-10 sm:px-20 rounded-xl transition-colors mt-2">
          {{ authStore.isLoading ? 'در حال ارسال...' : 'ادامه' }}
        </button>
      </div>
    </form>
  </div>
</template>