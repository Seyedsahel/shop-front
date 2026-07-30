<script setup lang="ts">
import { Toaster } from 'vue-sonner'
</script>
<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toaster rich-colors position="top-left" dir="rtl" />
    
  </div>
</template>
