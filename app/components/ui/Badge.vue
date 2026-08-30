<!-- app/components/ui/Badge.vue -->
<script setup lang="ts">
defineProps<{ variant?: 'discount' | 'stock' | 'default' }>()
</script>

<template>
  <span
    class="text-xs font-medium px-2 py-0.5 rounded-full"
    :class="{
      'bg-danger text-danger-foreground':          variant === 'discount',
      'bg-accent-subtle text-accent-foreground':   variant === 'stock',
      'bg-surface-hover text-text-secondary':      !variant || variant === 'default',
    }"
  >
    <slot />
  </span>
</template>