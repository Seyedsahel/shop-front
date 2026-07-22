<script setup lang="ts">
defineProps<{ variant?: 'accent' | 'danger' }>()
</script>

<template>
  <span
    class="text-xs font-medium px-2 py-0.5 rounded-full"
    :class="variant === 'danger'
      ? 'bg-danger-subtle text-danger-foreground'
      : 'bg-accent-subtle text-accent-foreground'"
  >
    <slot />
  </span>
</template>