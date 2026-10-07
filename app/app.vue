<script setup lang="ts">
import { Toaster } from 'vue-sonner'

const shop = useShopStore()
await callOnce('shop:info', () => shop.fetchShop().then(() => {}))
useHead(() => ({
  title: shop.name,
  titleTemplate: (title?: string) => title && title !== shop.name ? `${title} | ${shop.name}` : shop.name,
}))
useSeoMeta({ ogSiteName: () => shop.name })
</script>
<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
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
</template>
