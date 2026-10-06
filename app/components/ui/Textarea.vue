<script setup lang="ts">
defineOptions({ inheritAttrs: false })
const props = defineProps<{
  id?: string
  disabled?: boolean
  label?: string
  placeholder?: string
  rows?: number
  validate?: (value: string) => string
}>()

const model = defineModel<string>({ required: true })
const error = defineModel<string>('error', { default: '' })
const generatedId = useId()
const fieldId = computed(() => props.id || generatedId)
const attrs = useAttrs()
function accessibleLabel() {
  return typeof attrs['aria-label'] === 'string'
    ? attrs['aria-label'] : !props.label && !attrs['aria-labelledby'] ? props.placeholder : undefined
}

function runValidation() {
  if (props.validate) error.value = props.validate(model.value)
}

defineExpose({ validate: runValidation })
</script>

<template>
  <div class="flex flex-col gap-2 w-full" :class="$attrs.class">
    <label v-if="label" :for="fieldId" class="text-sm text-text-secondary self-start">{{ label }}</label>
    <div class="border rounded-xl w-full py-2 px-4 transition-colors bg-card focus-within:border-primary focus-within:ring-2 focus-within:ring-focus-ring" :class="error ? 'border-danger-border' : 'border-border-strong'">
      <textarea
        v-bind="{ ...$attrs, class: undefined }"
        :id="fieldId"
        :disabled="disabled"
        :aria-label="accessibleLabel()"
        :aria-invalid="!!error"
        :aria-describedby="[$attrs['aria-describedby'], error ? `${fieldId}-error` : undefined].filter(Boolean).join(' ') || undefined"
        v-model="model"
        :rows="rows ?? 4"
        :placeholder="placeholder"
        class="w-full bg-transparent outline-none text-text-primary placeholder:text-text-muted resize-none"
        @blur="runValidation"
      />
    </div>
    <p v-if="error" :id="`${fieldId}-error`" role="alert" class="text-danger text-xs self-start">{{ error }}</p>
  </div>
</template>
