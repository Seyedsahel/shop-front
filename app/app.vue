<script setup lang="ts">
import { Toaster } from 'vue-sonner'
</script>
<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toaster
      rich-colors
      position="top-center"
      dir="rtl"
      offset="48px"
      close-button
      :swipe-directions="['top', 'left', 'right']"
      :toast-options="{ class: 'app-toast font-sans' }"
    />
    <UiConfirmDialog />
  </div>
</template>
