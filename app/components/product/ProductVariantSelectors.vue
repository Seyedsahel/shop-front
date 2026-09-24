<script setup lang="ts">
import type { VariantAttribute } from '~/composables/useProductVariants'

defineProps<{
  attributes: VariantAttribute[]
  selectedOptions: Record<string, string>
  disabled?: boolean
}>()

const emit = defineEmits<{ select: [slug: string, value: string] }>()

function onChange(slug: string, event: Event) {
  emit('select', slug, (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <div v-if="attributes.length" class="grid gap-3 sm:grid-cols-2">
    <label v-for="attribute in attributes" :key="attribute.slug" class="flex flex-col gap-2 text-sm text-text-secondary">
      <span class="font-medium text-text-primary">{{ attribute.name }}</span>
      <select
        :value="selectedOptions[attribute.slug] ?? ''"
        :disabled="disabled || attribute.disabled"
        class="min-h-12 rounded-xl border border-border-strong bg-card px-4 py-3 text-sm text-text-primary outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
        @change="onChange(attribute.slug, $event)"
      >
        <option value="">{{ attribute.disabled ? 'ناموجود' : `انتخاب ${attribute.name}` }}</option>
        <option v-for="option in attribute.options" :key="option.value" :value="option.value" :disabled="!option.available">
          {{ option.value }}{{ option.available ? '' : ' (ناموجود)' }}
        </option>
      </select>
    </label>
  </div>
</template>
