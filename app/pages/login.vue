<script setup lang="ts">
import { ref } from 'vue'

const phoneNumber = ref('')
const error = ref('')

const validatePhone = () => {
  const regex = /^09\d{9}$/
  if (!phoneNumber.value) {
    error.value = 'شماره تماس الزامی است.'
  } else if (!regex.test(phoneNumber.value)) {
    error.value = 'شماره تماس معتبر نیست.'
  } else {
    error.value = ''
  }
}

const handleLogin = () => {
  validatePhone()
  if (error.value) return
  // Login logic here
}
</script>

<template>
  <div class="flex flex-col justify-center items-center min-h-[calc(100vh-var(--spacing-navbar))] px-4">
    <div class="w-full max-w-sm sm:max-w-md px-6 sm:px-16 py-8 border border-border-strong rounded-2xl shadow-md">
      <NuxtLink to="/">
        <UIcon name="solar:arrow-right-broken" class="size-6 text-accent-foreground" />
      </NuxtLink>

      <div class="flex flex-col justify-center items-center gap-8 sm:gap-11 mt-4">
        <h1 class="text-text-primary text-lg sm:text-xl font-semibold">ثبت نام یا ورود</h1>

        <form class="w-full" @submit.prevent="handleLogin" novalidate>
          <div class="flex flex-col items-center mb-4 gap-3 w-full">
            <label for="phoneNumber" class="text-sm text-text-secondary self-start">
              لطفا شماره تلفن خود را وارد کنید.
            </label>

            <div
              class="border rounded-xl w-full py-2 px-4 transition-colors"
              :class="error ? 'border-danger-border' : 'border-border-strong'"
            >
              <input
                type="tel"
                id="phoneNumber"
                v-model="phoneNumber"
                placeholder="09xxxxxxxxx"
                class="w-full bg-transparent outline-none text-text-primary placeholder:text-text-muted"
                @blur="validatePhone"
                required
              />
            </div>

            <p v-if="error" class="text-danger text-sm self-start mr-0.5">{{ error }}</p>

            <button
              type="submit"
              class="w-full sm:w-auto bg-secondary hover:bg-secondary/80 border border-divider text-text-on-dark py-2 px-10 sm:px-20 rounded-xl transition-colors mt-2"
            >
              ورود
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>