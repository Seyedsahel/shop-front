
<script setup lang="ts">
const model = defineModel<string>({ required: true })
const error = defineModel<string>('error', { default: '' })

const validate = () => {
  if (!model.value) {
    error.value = 'شماره تماس الزامی است.'
  } else if (!/^09\d{9}$/.test(model.value)) {
    error.value = 'شماره تماس معتبر نیست.'
  } else {
    error.value = ''
  }
}

defineExpose({ validate })
</script>

<template>
  <div class="flex flex-col items-center gap-3 w-full">
    <label for="phoneNumber" class="text-sm text-text-secondary self-start">
      لطفا شماره تلفن خود را وارد کنید.
    </label>
    <div class="border rounded-xl w-full py-2 px-4 transition-colors"
      :class="error ? 'border-danger-border' : 'border-border-strong'">
      <input type="tel" id="phoneNumber" v-model="model" placeholder="09xxxxxxxxx"
        class="w-full bg-transparent outline-none text-text-primary placeholder:text-text-muted"
        @blur="validate" required />
    </div>
    <p v-if="error" class="text-danger text-xs self-start">{{ error }}</p>
  </div>
</template>