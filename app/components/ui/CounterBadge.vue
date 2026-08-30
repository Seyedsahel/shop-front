<script setup lang="ts">
defineProps<{ count: number }>()
</script>

<template>
  <span
    v-if="count > 0"
    class="absolute -top-1.5 -inset-e-1.5 min-w-4 h-4 lg:min-w-5 lg:h-5 px-1 rounded-full bg-danger  text-danger-foreground text-[10px] font-extrabold flex items-center justify-center"
  >
    {{ count > 99 ? '99+' : count }}
  </span>
</template>