<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <NuxtLink
  v-if="!route.path.startsWith('/consultation')"
  to="/consultation"
  class="fixed bottom-24 left-6 z-40 size-14 rounded-full bg-secondary hover:bg-secondary/90 text-text-on-dark shadow-lg flex items-center justify-center transition-transform hover:scale-105"
  aria-label="دریافت نوبت مشاوره"
>
  <UIcon name="solar:dialog-broken" class="size-8" />
</NuxtLink>
</template>