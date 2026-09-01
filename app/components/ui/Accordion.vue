<script setup lang="ts">
defineProps<{ title: string; icon?: string }>()
const open = ref(false)
</script>

<template>
  <div class="border-b border-divider">
    <button class="w-full flex items-center justify-between py-3.5" @click="open = !open">
      <span class="flex items-center gap-2 text-sm font-medium text-text-secondary">
        <UIcon v-if="icon" :name="icon" class="size-4 text-text-secondary" />
        {{ title }}
      </span>
      <UIcon name="solar:alt-arrow-down-linear" class="size-4 text-text-muted transition-transform" :class="open ? 'rotate-180' : ''" />
    </button>
    <div v-if="open" class="pb-4">
      <slot />
    </div>
  </div>
</template>