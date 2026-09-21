<script setup lang="ts">
const props = withDefaults(defineProps<{
  isLoading?: boolean
  skeletonCount?: number
  itemWidthPx?: number
}>(), {
  skeletonCount: 6,
  itemWidthPx: 176,
})

const track = ref<HTMLElement>()
const canScrollForward = ref(false)
const canScrollBackward = ref(false)
let resizeObserver: ResizeObserver | undefined

function updateScrollState() {
  const element = track.value
  if (!element) return

  const trackRect = element.getBoundingClientRect()
  const children = Array.from(element.children)
  canScrollBackward.value = children.some(child => child.getBoundingClientRect().right > trackRect.right + 1)
  canScrollForward.value = children.some(child => child.getBoundingClientRect().left < trackRect.left - 1)
}

function scrollByItem(direction: 1 | -1) {
  track.value?.scrollBy({ left: direction * (props.itemWidthPx + 16), behavior: 'smooth' })
}

onMounted(() => {
  if (!track.value) return
  resizeObserver = new ResizeObserver(updateScrollState)
  resizeObserver.observe(track.value)
  nextTick(updateScrollState)
})

watch(() => props.isLoading, () => nextTick(updateScrollState))
onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<template>
  <div class="flex w-full items-center justify-center gap-3.5">
    <button
      class="hidden sm:p-2 sm:flex items-center justify-center rounded-full border border-border-strong text-text-secondary hover:text-text-primary bg-surface transition-colors"
      type="button"
      aria-label="نمایش موارد قبلی"
      :disabled="!canScrollBackward"
      :class="{ 'cursor-not-allowed opacity-40': !canScrollBackward }"
      @click="scrollByItem(1)"
    >
      <UIcon name="solar:arrow-right-broken" class="size-4" />
    </button>

    <div
      ref="track"
      class="flex min-w-0 flex-1 gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none"
      @scroll="updateScrollState"
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
      type="button"
      aria-label="نمایش موارد بعدی"
      :disabled="!canScrollForward"
      :class="{ 'cursor-not-allowed opacity-40': !canScrollForward }"
      @click="scrollByItem(-1)"
    >
      <UIcon name="solar:arrow-left-broken" class="size-4" />
    </button>
  </div>
</template>
