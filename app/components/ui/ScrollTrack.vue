<script setup lang="ts">
withDefaults(defineProps<{
  isLoading?: boolean
  skeletonCount?: number
  itemWidthPx?: number
}>(), {
  skeletonCount: 6,
  itemWidthPx: 176,
})

const track = ref<HTMLElement>()
function scrollByItem(direction: 1 | -1) {
  track.value?.scrollBy({ left: direction * 160, behavior: 'smooth' })
}
</script>

<template>
  <div class="flex items-center justify-center gap-3.5">
    <button
      class="hidden sm:p-2 sm:flex items-center justify-center rounded-full border border-border-strong text-text-secondary hover:text-text-primary bg-surface transition-colors"
      @click="scrollByItem(1)"
    >
      <UIcon name="solar:arrow-right-broken" class="size-4" />
    </button>

    <div
      ref="track"
      class="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none"
    >
      <template v-if="isLoading">
        <div
          v-for="n in skeletonCount"
          :key="n"
          class="shrink-0 rounded-2xl bg-loading animate-pulse"
          :style="{ width: `${itemWidthPx}px`, aspectRatio: '1' }"
        />
      </template>

      <slot v-else />
    </div>

    <button
      class="hidden sm:p-2 sm:flex items-center justify-center rounded-full border border-border-strong text-text-secondary hover:text-text-primary bg-surface transition-colors"
      @click="scrollByItem(-1)"
    >
      <UIcon name="solar:arrow-left-broken" class="size-4" />
    </button>
  </div>
</template>