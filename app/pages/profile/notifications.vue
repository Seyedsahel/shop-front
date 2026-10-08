<script setup lang="ts">
import { useEventListener } from '@vueuse/core'

definePageMeta({ middleware: 'auth' })
const notifications = useNotificationStore()
const auth = useAuthStore()
const toast = useAppToast()

function refresh() {
  return Promise.allSettled([notifications.fetchAll(notifications.page, true), notifications.fetchCounts(true)])
}

async function markRead(id?: string) {
  try {
    await notifications.markRead(id)
    toast.success(id ? 'اعلان خوانده شد.' : 'همه اعلان‌ها خوانده شدند.')
  } catch (cause) {
    toast.error(cause instanceof ApiError ? cause.message : 'علامت‌گذاری اعلان‌ها ناموفق بود.')
  }
}

await callOnce(`notifications:${auth.sessionScope}`, refresh, { mode: 'navigation' })
useEventListener(import.meta.client ? document : undefined, 'visibilitychange', () => {
  if (document.visibilityState === 'visible' && auth.isAuthenticated) void refresh()
})
useSeoMeta({ title: 'اعلان‌ها', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
    <NuxtLink to="/profile" class="text-sm text-primary">بازگشت به حساب کاربری</NuxtLink>
    <header class="my-6 flex flex-wrap items-center justify-between gap-4">
      <div><h1 class="text-2xl font-bold text-text-primary">اعلان‌ها</h1><p class="mt-2 text-sm text-text-secondary">{{ notifications.counts.unread_total }} اعلان خوانده‌نشده</p></div>
      <div class="flex flex-wrap gap-2">
        <button type="button" :disabled="notifications.mutating || notifications.countsLoading || notifications.counts.unread_total === 0" class="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50" @click="markRead()">خواندن همه</button>
        <button type="button" :disabled="notifications.mutating || notifications.loading || notifications.countsLoading" class="rounded-xl border border-border px-4 py-2 text-sm text-text-primary disabled:opacity-50" @click="refresh">تازه‌سازی</button>
      </div>
    </header>
    <p v-if="notifications.error || notifications.countsError" role="alert" class="mb-4 rounded-xl border border-danger-border p-4 text-sm text-danger">{{ notifications.error || notifications.countsError }}</p>
    <p v-if="notifications.loading && !notifications.loaded" role="status" class="p-8 text-center text-text-secondary">در حال دریافت اعلان‌ها…</p>
    <NotificationList v-else-if="notifications.items.length" :items="notifications.items" :disabled="notifications.mutating || notifications.loading" @read="markRead" />
    <p v-else-if="notifications.loaded && !notifications.error" class="rounded-2xl border border-dashed border-border p-8 text-center text-text-secondary">هنوز اعلانی ندارید.</p>
    <nav v-if="notifications.limit > 0 && notifications.total > notifications.limit" aria-label="صفحه‌های اعلان" class="mt-6 flex items-center justify-center gap-4 text-sm">
      <button type="button" :disabled="notifications.loading || notifications.mutating || notifications.page <= 1" class="rounded-xl border border-border px-4 py-2 text-text-primary disabled:opacity-50" @click="notifications.fetchAll(notifications.page - 1).catch(() => {})">صفحه قبل</button>
      <span class="text-text-secondary">صفحه {{ notifications.page }} از {{ Math.ceil(notifications.total / notifications.limit) }}</span>
      <button type="button" :disabled="notifications.loading || notifications.mutating || notifications.page >= Math.ceil(notifications.total / notifications.limit)" class="rounded-xl border border-border px-4 py-2 text-text-primary disabled:opacity-50" @click="notifications.fetchAll(notifications.page + 1).catch(() => {})">صفحه بعد</button>
    </nav>
  </div>
</template>
