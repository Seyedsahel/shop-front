<script setup lang="ts">
import BottomNav from '~/components/nav/BottomNav.vue';


    useHead({
    htmlAttrs: { dir: 'rtl', lang: 'fa' }
    })
</script>

<template>
  <div>
    <NavNavbar />
    <slot />
    <ConsultationFab/>
    <BottomNav/>
  
  </div>
</template>
