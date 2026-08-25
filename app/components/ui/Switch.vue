<script setup lang="ts">
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <button
    type="button"
    class="w-10 h-6 rounded-full transition-colors relative shrink-0"
    :class="model ? 'bg-accent' : 'bg-border-strong'"
    @click="model = !model"
  >
    <span
      class="absolute top-0.5 size-5 rounded-full bg-disabled-bg transition-transform"
      :class="model ? 'inset-s-4' : 'inset-s-0.5'"
    />
  </button>
</template>