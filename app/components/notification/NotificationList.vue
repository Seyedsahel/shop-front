<script setup lang="ts">
defineProps<{ items: AppNotification[]; disabled: boolean }>()
defineEmits<{ read: [id: string] }>()

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('fa-IR')
}
</script>

<template>
  <ul class="space-y-3">
    <li v-for="item in items" :key="item.id" class="rounded-2xl border p-5" :class="item.read_at ? 'border-border bg-card' : 'border-primary bg-primary-subtle'">
      <div class="flex items-start gap-3">
        <UIcon name="solar:bell-outline" class="mt-1 size-5 shrink-0 text-primary" />
        <div class="min-w-0 flex-1">
          <p class="whitespace-pre-wrap break-words text-text-primary">{{ item.body }}</p>
          <div class="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-text-secondary">
            <time :datetime="item.created_at">{{ formatDate(item.created_at) }}</time>
            <span v-if="item.read_at">خوانده شده</span>
            <button v-else type="button" :disabled="disabled" class="rounded-lg px-3 py-2 font-semibold text-primary hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50" @click="$emit('read', item.id)">علامت‌گذاری به‌عنوان خوانده شده</button>
          </div>
        </div>
      </div>
    </li>
  </ul>
</template>
