<script setup lang="ts">
const authStore = useAuthStore()
</script>

<template>
  <main class="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6">
    <div aria-hidden="true" class="pointer-events-none absolute -right-20 top-1/4 size-80 rounded-full bg-secondary/20 blur-3xl" />
    <div aria-hidden="true" class="pointer-events-none absolute -bottom-24 -left-20 size-80 rounded-full bg-primary/10 blur-3xl" />
    <div class="relative w-full max-w-md rounded-3xl border border-divider bg-card/95 p-8 shadow-xl backdrop-blur sm:p-9">
      <Transition name="fade" mode="out-in">
        <AuthPhoneStep v-if="authStore.step === 'phone'" key="phone" />
        <AuthOtpStep v-else key="otp" />
      </Transition>
    </div>
  </main>
</template>
