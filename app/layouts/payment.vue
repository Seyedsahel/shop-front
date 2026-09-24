<script setup lang="ts">
useHead({ htmlAttrs: { dir: 'rtl', lang: 'fa' } })
</script>

<template>
  <div class="flex min-h-screen flex-col bg-surface pb-16 sm:pb-0">
    <NavNavbar />
    <main class="flex-1">
      <slot />
    </main>
    <NavFooter class="mt-0" />
    <ConsultationFab />
    <NavBottomNav />
  </div>
</template>
