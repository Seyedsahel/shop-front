<script setup lang="ts">
defineOptions({ inheritAttrs: false })
withDefaults(defineProps<{ title?: string; side?: 'start' | 'end' }>(), {
  side: 'start',
})
const open = defineModel<boolean>({ required: true })
</script>

<template>
  <UiModal v-model="open" v-bind="$attrs" :title="title" :placement="side">
    <template #header="{ titleId, close }">
      <div class="flex h-14 shrink-0 items-center justify-between border-b border-divider px-4">
        <h2 :id="titleId" class="text-sm font-semibold text-text-primary" :class="{ 'sr-only': !title }">{{ title || 'منو' }}</h2>
        <button type="button" aria-label="بستن منو" class="text-text-secondary focus-visible:outline-2 focus-visible:outline-primary" @click="close">
          <UIcon name="solar:close-circle-broken" class="size-6" />
        </button>
      </div>
    </template>
    <div class="min-h-0 flex-1 overflow-y-auto"><slot /></div>
  </UiModal>
</template>
