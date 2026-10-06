<script setup lang="ts">
defineProps<{ title: string; icon?: string }>()
const open = ref(false)
const panelId = useId()
</script>

<template>
  <div class="border-b border-divider">
    <button type="button" :aria-expanded="open" :aria-controls="panelId" class="w-full flex items-center justify-between py-3.5 focus-visible:outline-2 focus-visible:outline-primary" @click="open = !open">
      <span class="flex items-center gap-2 text-sm font-medium text-text-secondary">
        <UIcon v-if="icon" :name="icon" class="size-4 text-text-secondary" />
        {{ title }}
      </span>
      <UIcon name="solar:alt-arrow-down-linear" class="size-4 text-text-muted transition-transform" :class="open ? 'rotate-180' : ''" />
    </button>
    <div v-show="open" :id="panelId" class="pb-4">
      <slot />
    </div>
  </div>
</template>
