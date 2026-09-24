<script setup lang="ts">
import type { VariantAttribute } from '~/composables/useProductVariants'

defineProps<{
  attributes: VariantAttribute[]
  selectedOptions: Record<string, string>
  disabled?: boolean
}>()

const emit = defineEmits<{ select: [slug: string, value: string] }>()
const fieldId = useId()

function itemsFor(attribute: VariantAttribute) {
  return attribute.options.map(option => ({
    label: option.available ? option.value : `${option.value} (ناموجود)`,
    value: option.value,
    disabled: !option.available,
  }))
}

function onSelect(slug: string, value: string) {
  emit('select', slug, value)
}
</script>

<template>
  <div v-if="attributes.length" class="grid gap-3 sm:grid-cols-2">
    <div v-for="attribute in attributes" :key="attribute.slug" class="flex min-w-0 flex-col gap-2 text-sm text-text-secondary">
      <div class="flex items-center justify-between gap-2">
        <span :id="`${fieldId}-${attribute.slug}`" class="font-medium text-text-primary">{{ attribute.name }}</span>
        <button
          v-if="selectedOptions[attribute.slug] && !disabled && !attribute.disabled"
          type="button"
          class="text-xs text-text-muted hover:text-primary focus-visible:outline-focus-ring"
          :aria-label="`پاک کردن انتخاب ${attribute.name}`"
          @click="onSelect(attribute.slug, '')"
        >پاک کردن</button>
      </div>
      <USelect
        :aria-labelledby="`${fieldId}-${attribute.slug}`"
        :model-value="selectedOptions[attribute.slug] || undefined"
        :items="itemsFor(attribute)"
        :placeholder="attribute.disabled ? 'ناموجود' : `انتخاب ${attribute.name}`"
        :disabled="disabled || attribute.disabled"
        :portal="false"
        :ui="{
          base: 'w-full min-h-12 rounded-xl border border-border-strong bg-card ps-4 pe-12 py-3 text-sm text-text-primary shadow-none focus-visible:outline-2 focus-visible:outline-focus-ring disabled:bg-disabled-bg',
          trailing: 'end-3',
          trailingIcon: 'size-4 text-text-muted',
          content: 'z-50 w-[var(--reka-select-trigger-width)] min-w-[var(--reka-select-trigger-width)] rounded-xl border border-border-strong bg-card shadow-lg',
          group: 'p-1',
          item: 'min-h-11 gap-2 rounded-none border-b border-divider bg-card px-3 py-3 text-text-primary last:border-b-0 data-[highlighted]:bg-primary-subtle data-[highlighted]:text-primary data-[state=checked]:bg-primary-subtle data-[disabled]:bg-disabled-bg data-[disabled]:text-disabled-text',
          itemLabel: 'whitespace-normal break-words text-start',
          itemTrailing: 'shrink-0 ps-3',
        }"
        @update:model-value="onSelect(attribute.slug, $event)"
      />
    </div>
  </div>
</template>
