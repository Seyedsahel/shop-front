<script setup lang="ts">
defineProps<{ links: { label: string; href: string }[] }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <div class="flex flex-col">
    <NuxtLink
      v-for="link in links"
      :key="link.href"
      :to="link.href"
      class="px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
      @click="$emit('close')"
    >
      {{ link.label }}
    </NuxtLink>
  </div>
</template>