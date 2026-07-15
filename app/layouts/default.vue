<script setup lang="ts">
    useHead({
    htmlAttrs: { dir: 'rtl', lang: 'fa' }
    })
</script>

<template>
  <div>
    <NavNavbar />
    <slot />
  </div>
</template>
