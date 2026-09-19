<script setup lang="ts">
const state = useConfirmState()

function updateOpen(open: boolean) {
  if (!open && state.value.open) resolveConfirm(false)
}
</script>

<template>
  <UiModal
    :model-value="state.open"
    :title="state.options.title"
    @update:model-value="updateOpen"
  >
    <p class="text-sm leading-7 text-text-secondary">{{ state.message }}</p>
    <div class="mt-6 flex justify-end gap-3">
      <button type="button" class="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-primary" @click="resolveConfirm(false)">
        {{ state.options.cancelLabel }}
      </button>
      <button type="button" class="rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors focus-visible:outline-2 focus-visible:outline-primary" :class="state.options.variant === 'danger' ? 'bg-danger hover:bg-danger/90' : 'bg-primary hover:bg-primary-hover'" @click="resolveConfirm(true)">
        {{ state.options.confirmLabel }}
      </button>
    </div>
  </UiModal>
</template>
