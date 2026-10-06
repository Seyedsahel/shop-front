<script setup lang="ts">
defineProps<{ title?: string }>()
const open = defineModel<boolean>({ required: true })
</script>

<template>
  <UiModal v-model="open" :title="title" placement="bottom">
    <template #header="{ titleId, close }">
      <div class="flex shrink-0 justify-center pb-1 pt-2.5" aria-hidden="true"><div class="h-1 w-10 rounded-full bg-border-strong" /></div>
      <div class="flex shrink-0 items-center justify-between border-b border-divider px-4 pb-3">
        <button type="button" aria-label="بستن پنجره" class="text-text-secondary focus-visible:outline-2 focus-visible:outline-primary" @click="close">
          <UIcon name="solar:close-circle-broken" class="size-6" />
        </button>
        <h2 :id="titleId" class="text-sm font-semibold text-text-primary" :class="{ 'sr-only': !title }">{{ title || 'پنجره' }}</h2>
      </div>
    </template>
    <div class="min-h-0 flex-1 overflow-y-auto"><slot /></div>
  </UiModal>
</template>
