<script setup lang="ts">
const props = defineProps<{
  label?: string
  placeholder?: string
  rows?: number
  validate?: (value: string) => string
}>()

const model = defineModel<string>({ required: true })
const error = defineModel<string>('error', { default: '' })

function runValidation() {
  if (props.validate) error.value = props.validate(model.value)
}

defineExpose({ validate: runValidation })
</script>

<template>
  <div class="flex flex-col gap-2 w-full">
    <label v-if="label" class="text-sm text-text-secondary self-start">{{ label }}</label>
    <div class="border rounded-xl w-full py-2 px-4 transition-colors bg-card" :class="error ? 'border-danger-border' : 'border-border-strong'">
      <textarea
        v-model="model"
        :rows="rows ?? 4"
        :placeholder="placeholder"
        class="w-full bg-transparent outline-none text-text-primary placeholder:text-text-muted resize-none"
        @blur="runValidation"
      />
    </div>
    <p v-if="error" class="text-danger text-xs self-start">{{ error }}</p>
  </div>
</template>