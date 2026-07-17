<script setup lang="ts">
const phoneNumber = ref('')
const error = ref('')
const phoneInput = ref()

const handleLogin = () => {
  phoneInput.value?.validate()
  if (error.value) return
  // Login logic
}
</script>

<template>
  <div class="flex flex-col justify-center items-center min-h-[calc(100vh-4rem)] px-4">
    <div class="w-full max-w-sm sm:max-w-md px-6 sm:px-16 py-8 border border-border-strong rounded-2xl shadow-md">
      <NuxtLink to="/"><UIcon name="solar:arrow-right-broken" class="size-6 text-accent-foreground" /></NuxtLink>
      <div class="flex flex-col items-center gap-8 sm:gap-11 mt-4">
        <h1 class="text-text-primary text-lg sm:text-xl font-semibold">ثبت نام یا ورود</h1>
        <form class="w-full" @submit.prevent="handleLogin" novalidate>
          <div class="flex flex-col items-center mb-4 gap-3 w-full">
            <UiPhoneInput ref="phoneInput" v-model="phoneNumber" v-model:error="error" />
            <button type="submit"
              class="w-full sm:w-auto bg-secondary hover:bg-secondary/80 border border-divider text-text-on-dark py-2 px-10 sm:px-20 rounded-xl transition-colors mt-2">
              ورود
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>