<script setup lang="ts">
const props = defineProps<{
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

function runValidation() {
  if (props.validate)
    error.value = props.validate(model.value)
}

defineExpose({ validate: runValidation })
</script>

<template>
  <div class="flex flex-col items-center gap-3 w-full">
    <label v-if="label" class="text-sm text-text-secondary self-start">{{ label }}</label>
    <div
      class="border rounded-xl w-full py-2 px-4 transition-colors"
      :class="error ? 'border-danger-border' : 'border-border-strong'"
    >
      <input
        :type="type ?? 'text'"
        :inputmode="inputmode"
        :maxlength="maxlength"
        v-model="model"
        :placeholder="placeholder"
        class="w-full bg-transparent outline-none text-text-primary placeholder:text-text-muted"
        :class="centered ? 'text-center tracking-widest' : ''"
        @blur="runValidation"
      />
    </div>
    <p v-if="error" class="text-danger text-xs self-start">{{ error }}</p>
  </div>
</template>