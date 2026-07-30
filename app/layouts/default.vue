<script setup lang="ts">
    useHead({
    htmlAttrs: { dir: 'rtl', lang: 'fa' }
    })
</script>

<template>
  <div class="flex flex-col min-h-screen pb-16 sm:pb-0">
    <NavNavbar />
    <main class="flex-1">
      <slot />
    </main>
    <NavFooter />
    <ConsultationFab />
    <NavBottomNav />
  </div>
</template>