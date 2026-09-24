<script setup lang="ts">
const code = defineModel<string>({ required: true })
defineProps<{ disabled?: boolean; applyDisabled?: boolean; pending?: boolean; applied?: boolean }>()
defineEmits<{ apply: [] }>()
</script>

<template>
  <div>
    <form class="flex rounded-xl bg-surface p-1" @submit.prevent="$emit('apply')">
      <input v-model="code" type="text" autocomplete="off" aria-label="کد تخفیف" class="min-w-0 flex-1 bg-transparent px-3 text-xs outline-none placeholder:text-text-muted" placeholder="کد تخفیف یا کارت هدیه" :disabled="disabled || pending">
      <button type="submit" class="rounded-lg bg-card px-3 py-2 text-xs font-semibold text-text-secondary disabled:opacity-50" :disabled="disabled || applyDisabled || pending">{{ pending ? 'در حال بررسی…' : 'اعمال' }}</button>
    </form>
    <p v-if="applied && code.trim()" class="mt-2 text-xs text-success">کد با پیش‌نمایش سفارش بررسی شد.</p>
  </div>
</template>
