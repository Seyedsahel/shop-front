<script setup lang="ts">
import { Toaster } from 'vue-sonner'
</script>
<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
    </NuxtLayout>
    <NuxtPage />
    <Toaster rich-colors position="top-left" dir="rtl" />
    
  </div>
</template>
