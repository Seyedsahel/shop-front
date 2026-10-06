<script setup lang="ts">
defineProps<{ disabled?: boolean }>()
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="model"
    :disabled="disabled"
    class="w-10 h-6 rounded-full transition-colors relative shrink-0 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-primary"
    :class="model ? 'bg-accent' : 'bg-border-strong'"
    @click="model = !model"
  >
    <span
      class="absolute top-0.5 size-5 rounded-full bg-disabled-bg transition-transform"
      :class="model ? 'inset-s-4' : 'inset-s-0.5'"
    />
  </button>
</template>
