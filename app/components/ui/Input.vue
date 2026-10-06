<script setup lang="ts">
defineOptions({ inheritAttrs: false })
const props = defineProps<{
  id?: string
  disabled?: boolean
  label?: string
  type?: string
  placeholder?: string
  inputmode?: 'url' | 'text' | 'email' | 'search' | 'tel' | 'none' | 'numeric' | 'decimal'
  maxlength?: number
  centered?: boolean
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
  if (props.validate)
    error.value = props.validate(model.value)
}

defineExpose({ validate: runValidation })
</script>

<template>
  <div class="flex flex-col items-center gap-3 w-full" :class="$attrs.class">
    <label v-if="label" :for="fieldId" class="text-sm text-text-secondary self-start">{{ label }}</label>
    <div
      class="border rounded-xl w-full py-2 px-4 transition-colors bg-card focus-within:border-primary focus-within:ring-2 focus-within:ring-focus-ring"
      :class="error ? 'border-danger-border' : 'border-border-strong'"
    >
      <input
        v-bind="{ ...$attrs, class: undefined }"
        :id="fieldId"
        :disabled="disabled"
        :aria-label="accessibleLabel()"
        :aria-invalid="!!error"
        :aria-describedby="[$attrs['aria-describedby'], error ? `${fieldId}-error` : undefined].filter(Boolean).join(' ') || undefined"
        :type="type ?? 'text'"
        :inputmode="inputmode"
        :maxlength="maxlength"
        v-model="model"
        :placeholder="placeholder"
        :dir="inputmode === 'tel' ? 'ltr' : undefined"
        class="w-full bg-transparent outline-none text-text-primary placeholder:text-text-muted"
        :class="centered ? 'text-center tracking-widest' : inputmode === 'tel' ? 'text-left' : ''"
        @blur="runValidation"
      />
    </div>
    <p v-if="error" :id="`${fieldId}-error`" role="alert" class="text-danger text-xs self-start">{{ error }}</p>
  </div>
</template>
