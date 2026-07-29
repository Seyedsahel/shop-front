<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  isLoading?: boolean
  skeletonCount?: number
  itemWidthPx?: number
}>(), {
  skeletonCount: 6,
  itemWidthPx: 176, // 44 * 4 — matches your existing w-44 card width
})

const track = ref<HTMLElement>()
function scrollByItem(direction: 1 | -1) {
  track.value?.scrollBy({ left: direction * 160, behavior: 'smooth' })
}
</script>

<template>
  <section class="max-w-dvw mx-auto px-4 sm:px-6 lg:px-16 py-10">
        <div class="flex justify-center items-center mb-7">
            <h2 v-if="title" class="text-lg sm:text-2xl font-semibold text-text-primary">
                {{ title }}
            </h2>
        </div>

    <div class="flex items-center justify-center gap-3.5">
         <button
          class="hidden sm:p-2 sm:flex items-center justify-center rounded-full border border-border-strong text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
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
          class="hidden sm:p-2 sm:flex items-center justify-center rounded-full border border-border-strong text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
          @click="scrollByItem(-1)"
        >
          <UIcon name="solar:arrow-left-broken" class="size-4" />
        </button>
    </div>
   
  </section>
</template>