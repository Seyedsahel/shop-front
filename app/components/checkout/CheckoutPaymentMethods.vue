<script setup lang="ts">
const selected = defineModel<string>({ required: true })
defineProps<{ methods: PaymentMethod[]; loading?: boolean; disabled?: boolean }>()
</script>

<template>
  <fieldset :disabled="disabled || loading">
    <legend class="mb-3 text-sm font-semibold text-text-primary">روش پرداخت</legend>
    <p v-if="loading" role="status" class="text-sm text-text-secondary">در حال دریافت روش‌های پرداخت…</p>
    <p v-else-if="!methods.length" role="status" class="text-sm text-text-secondary">روش پرداختی در دسترس نیست.</p>
    <div v-else class="flex flex-wrap gap-2">
      <button v-for="method in methods" :key="method.id" type="button" :aria-pressed="selected === method.id" :disabled="disabled" class="rounded-xl border px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-50" :class="selected === method.id ? 'border-primary bg-primary-subtle text-primary' : 'border-border text-text-secondary hover:border-primary'" @click="selected = method.id">{{ method.name }}</button>
    </div>
  </fieldset>
</template>
