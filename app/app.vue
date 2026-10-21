<script setup lang="ts">
import { Toaster } from 'vue-sonner'

const shop = useShopStore()
const { isLoading: isPageLoading } = useLoadingIndicator({ throttle: 0, hideDelay: 0, resetDelay: 0 })
await callOnce('shop:info', () => shop.fetchShop().then(() => {}))
useHead(() => ({
  title: shop.name,
  titleTemplate: (title?: string) => title && title !== shop.name ? `${title} | ${shop.name}` : shop.name,
  link: [{ key: 'favicon', rel: 'icon', href: shop.info?.logoImageUrl || 'data:,' }],
}))
useSeoMeta({ ogSiteName: () => shop.name })
</script>
<template>
  <UApp dir="rtl" :toaster="null">
    <div>
      <NuxtRouteAnnouncer />
      <NuxtLayout>
        <div :aria-busy="isPageLoading">
          <div v-if="isPageLoading" role="status" aria-live="polite" class="flex min-h-[60vh] items-center justify-center gap-3 text-sm text-text-muted">
            <span class="size-6 animate-spin rounded-full border-2 border-border-strong border-t-primary" aria-hidden="true" />
            <span>در حال بارگذاری صفحه...</span>
          </div>
          <!-- Keep NuxtPage mounted so the destination can resolve its async setup. -->
          <div v-show="!isPageLoading">
            <NuxtPage />
          </div>
        </div>
      </NuxtLayout>
      <Toaster
        rich-colors
        position="top-center"
        dir="rtl"
        offset="48px"
        close-button
        :swipe-directions="['top', 'left', 'right']"
        :toast-options="{ class: 'app-toast font-sans' }"
      />
      <UiConfirmDialog />
    </div>
  </UApp>
</template>
