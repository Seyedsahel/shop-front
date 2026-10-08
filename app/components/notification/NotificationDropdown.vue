<script setup lang="ts">
const notifications = useNotificationStore()
const auth = useAuthStore()
const toast = useAppToast()
const open = ref(false)
const route = useRoute()
const busy = computed(() => notifications.latestLoading || notifications.countsLoading || notifications.mutating)

function refresh() {
  return Promise.allSettled([notifications.fetchLatest(true), notifications.fetchCounts(true)])
}

watch(open, value => { if (value) void refresh() })
watch(() => route.fullPath, () => { open.value = false })
watch(() => auth.sessionScope ?? auth.identity, () => { open.value = false })

async function readAll() {
  try {
    await notifications.markRead()
    toast.success('همه اعلان‌ها خوانده شدند.')
  } catch (cause) {
    toast.error(cause instanceof ApiError ? cause.message : 'علامت‌گذاری اعلان‌ها ناموفق بود.')
  }
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('fa-IR')
}
</script>

<template>
  <UPopover v-model:open="open" :content="{ align: 'end', sideOffset: 12 }" :ui="{ content: 'z-[60] w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card text-text-primary shadow-xl ring-0' }">
    <button type="button" :aria-label="`اعلان‌ها، ${notifications.counts.unread_total} خوانده‌نشده`" class="relative inline-flex h-9 w-7 items-center justify-center rounded-md text-text-primary hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-primary md:h-auto md:w-auto md:px-2 md:py-1.5">
      <UIcon name="solar:bell-outline" class="size-5" />
      <UiCounterBadge :count="notifications.counts.unread_total" />
    </button>
    <template #content>
      <section aria-label="اعلان‌ها" dir="rtl">
        <header class="flex items-center justify-between border-b border-border px-4 py-4">
          <h2 class="text-sm font-bold">اعلان‌ها</h2>
          <div class="flex items-center gap-2 text-text-secondary">
            <button type="button" aria-label="تازه‌سازی اعلان‌ها" :disabled="busy" class="grid size-8 place-items-center rounded-lg hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50" @click="refresh"><UIcon name="solar:refresh-outline" class="size-4" /></button>
            <button type="button" aria-label="بستن اعلان‌ها" class="grid size-8 place-items-center rounded-lg hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-primary" @click="open = false"><UIcon name="solar:close-circle-outline" class="size-4" /></button>
          </div>
        </header>
        <div class="flex items-center justify-between gap-3 px-4 py-3 text-xs">
          <p class="text-text-secondary">اعلان‌های اختصاصی حساب شما</p>
          <button type="button" :disabled="busy || notifications.counts.unread_total === 0" class="shrink-0 rounded px-1 py-1 text-primary focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40" @click="readAll">خواندن همه</button>
        </div>
        <div class="max-h-[min(24rem,60dvh)] overflow-y-auto">
          <p v-if="notifications.latestError || notifications.countsError" role="alert" class="px-4 py-3 text-sm text-danger">{{ notifications.latestError || notifications.countsError }}</p>
          <p v-if="notifications.latestLoading && !notifications.latest.length" role="status" class="px-4 py-8 text-center text-sm text-text-secondary">در حال دریافت اعلان‌ها…</p>
          <ul v-else-if="notifications.latest.length" class="divide-y divide-border">
            <li v-for="item in notifications.latest" :key="item.id" class="px-4 py-3" :class="!item.read_at ? 'bg-primary-subtle' : ''">
              <p class="whitespace-pre-wrap break-words text-sm leading-6">{{ item.body }}</p>
              <div class="mt-2 flex items-center justify-between gap-2 text-xs text-text-muted"><time :datetime="item.created_at">{{ formatDate(item.created_at) }}</time><span v-if="!item.read_at" class="text-primary">خوانده‌نشده</span></div>
            </li>
          </ul>
          <p v-else-if="!notifications.latestError" class="px-4 py-8 text-center text-sm text-text-secondary">اعلانی برای نمایش نیست.</p>
        </div>
        <footer class="border-t border-border px-4 py-3 text-sm"><NuxtLink to="/profile/notifications" class="font-medium text-primary hover:underline" @click="open = false">همه اعلان‌ها</NuxtLink></footer>
      </section>
    </template>
  </UPopover>
</template>
