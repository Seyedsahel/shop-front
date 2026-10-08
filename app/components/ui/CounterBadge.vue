<script setup lang="ts">
withDefaults(defineProps<{
  count: number
  placement?: 'overlay' | 'inline'
}>(), {
  placement: 'overlay',
})
</script>

<template>
  <span
    v-if="count > 0 || placement === 'inline'"
    class="shrink-0 rounded-full inline-flex items-center justify-center"
    :class="placement === 'inline'
      ? 'min-w-5 h-5 px-1.5 border border-border-strong bg-surface-hover text-text-secondary text-xs font-medium'
      : 'absolute -top-1.5 -inset-e-1.5 min-w-4 h-4 lg:min-w-5 lg:h-5 px-1 bg-danger text-danger-foreground text-[10px] font-extrabold'"
  >
    {{ placement === 'inline' ? count.toLocaleString('en-US') : count > 99 ? '99+' : count }}
  </span>
</template>
