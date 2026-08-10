<script setup lang="ts">
defineProps<{ count: number }>()
</script>

<template>
  <span
    v-if="count > 0"
    class="absolute -top-1.5 -inset-e-1.5 min-w-4 h-4 px-1 rounded-full bg-danger-subtle text-text-on-dark text-[10px] font-extrabold flex items-center justify-center"
  >
    {{ count > 99 ? '99+' : count }}
  </span>
</template>