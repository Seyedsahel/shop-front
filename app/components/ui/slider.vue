<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  isLoading?: boolean
  skeletonCount?: number
  itemWidthPx?: number
}>(), {
  skeletonCount: 6,
  itemWidthPx: 176,
})
</script>

<template>
  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="flex justify-center items-center mb-7">
      <h2 v-if="title" class="text-lg sm:text-2xl font-semibold text-text-primary">
        {{ title }}
      </h2>
    </div>

    <UiScrollTrack :is-loading="isLoading" :skeleton-count="skeletonCount" :item-width-px="itemWidthPx">
      <slot />
    </UiScrollTrack>
  </section>
</template>