<script setup lang="ts">
withDefaults(defineProps<{
  count: number
  placement?: 'overlay' | 'inline'
  variant?: 'default' | 'primary' | 'secondary'
}>(), {
  placement: 'overlay',
  variant: 'default',
})
</script>

<template>
  <span
    v-if="count > 0 || placement === 'inline'"
    dir="ltr"
    class="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full text-center tabular-nums"
    :class="[
      placement === 'inline'
        ? 'h-5 min-w-5 px-1 text-xs font-medium'
        : 'absolute -top-1.5 -inset-e-1.5 h-4 min-w-4 px-1 text-[10px] font-extrabold lg:h-5 lg:min-w-5',
      variant === 'primary'
        ? 'bg-primary text-primary-foreground'
        : variant === 'secondary'
          ? 'bg-secondary text-secondary-foreground'
          : placement === 'inline'
            ? 'border border-border-strong bg-surface-hover text-text-secondary'
            : 'bg-danger text-danger-foreground',
    ]"
  >
    <!-- Center the numeral optically within Vazirmatn's taller text metrics. -->
    <span class="block translate-y-[0.08em] leading-none">{{ placement === 'inline' ? count.toLocaleString('en-US') : count > 99 ? '99+' : count }}</span>
  </span>
</template>
