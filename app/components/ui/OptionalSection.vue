<script setup lang="ts">
defineOptions({ inheritAttrs: false })
defineProps<{ failed?: boolean }>()
</script>

<template>
  <NuxtErrorBoundary>
    <slot v-if="!failed" />
  </NuxtErrorBoundary>
</template>
