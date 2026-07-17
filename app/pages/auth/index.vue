<script setup lang="ts">
const authStore = useAuthStore()
</script>

<template>
  <div class="flex flex-col justify-center items-center min-h-[calc(100vh-4rem)] px-4">
    <div class="w-full max-w-sm sm:max-w-md px-6 sm:px-16 py-8 border border-border-strong rounded-2xl shadow-md">
        <Transition name="fade" mode="out-in">
        <AuthPhoneStep v-if="authStore.step === 'phone'" key="phone" />
        <AuthOtpStep v-else key="otp" />
      </Transition>
    </div>
  </div>
</template>