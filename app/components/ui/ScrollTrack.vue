<script setup lang="ts">
const props = withDefaults(defineProps<{
  isLoading?: boolean
  skeletonCount?: number
  itemWidthPx?: number
  variant?: 'default' | 'tabs'
  ariaLabel?: string
}>(), {
  skeletonCount: 6,
  itemWidthPx: 176,
  variant: 'default',
})

const track = ref<HTMLElement>()
const canScrollForward = ref(false)
const canScrollBackward = ref(false)
const hasOverflow = ref(false)
const isRtl = ref(true)
let resizeObserver: ResizeObserver | undefined

function updateScrollState() {
  const element = track.value
  if (!element) return

  const trackRect = element.getBoundingClientRect()
  const bounds = Array.from(element.children, child => child.getBoundingClientRect())
  isRtl.value = getComputedStyle(element).direction === 'rtl'
  hasOverflow.value = element.scrollWidth > element.clientWidth + 1
  if (props.variant === 'tabs' && element.parentElement) {
    // Measure against the full row so arrows disappear once resizing makes all tabs fit.
    const row = element.parentElement
    const style = getComputedStyle(row)
    const availableWidth = row.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
    const contentWidth = bounds.length
      ? Math.max(...bounds.map(bound => bound.right)) - Math.min(...bounds.map(bound => bound.left))
      : 0
    hasOverflow.value = contentWidth > availableWidth + 1
  }
  const hiddenRight = bounds.some(bound => bound.right > trackRect.right + 1)
  const hiddenLeft = bounds.some(bound => bound.left < trackRect.left - 1)
  canScrollBackward.value = isRtl.value ? hiddenRight : hiddenLeft
  canScrollForward.value = isRtl.value ? hiddenLeft : hiddenRight
}

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
}

function scrollByItem(direction: 1 | -1) {
  const element = track.value
  if (!element) return
  const distance = props.variant === 'tabs' ? element.clientWidth * 0.75 : props.itemWidthPx + 16
  element.scrollBy({ left: direction * (isRtl.value ? 1 : -1) * distance, behavior: scrollBehavior() })
}

function revealItem(index: number) {
  const element = track.value
  const item = element?.children[index]
  if (!element || !item) return
  const viewport = element.getBoundingClientRect()
  const bounds = item.getBoundingClientRect()
  const left = bounds.left < viewport.left
    ? bounds.left - viewport.left
    : bounds.right > viewport.right ? bounds.right - viewport.right : 0
  if (left) element.scrollBy({ left, behavior: scrollBehavior() })
}

defineExpose({ revealItem })

onMounted(() => {
  if (!track.value) return
  resizeObserver = new ResizeObserver(updateScrollState)
  resizeObserver.observe(track.value)
  nextTick(updateScrollState)
})

watch(() => props.isLoading, () => nextTick(updateScrollState))
onUpdated(updateScrollState)
onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<template>
  <div class="flex w-full items-center justify-center" :class="variant === 'tabs' ? 'gap-1' : 'gap-3.5'">
    <button
      v-show="variant !== 'tabs' || hasOverflow"
      class="shrink-0 items-center justify-center rounded-full border border-border-strong text-text-secondary hover:text-text-primary bg-surface transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
      :class="variant === 'tabs' ? 'flex size-10' : 'hidden sm:p-2 sm:flex'"
      type="button"
      aria-label="نمایش موارد قبلی"
      :disabled="!canScrollBackward"
      @click="scrollByItem(1)"
    >
      <UIcon :name="isRtl ? 'solar:arrow-right-broken' : 'solar:arrow-left-broken'" class="size-4" />
    </button>

    <div
      ref="track"
      class="flex min-w-0 flex-1 overflow-x-auto motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      :class="variant === 'tabs' ? 'gap-1' : 'gap-4 snap-x snap-mandatory scroll-smooth'"
      :role="variant === 'tabs' ? 'tablist' : undefined"
      :aria-label="ariaLabel"
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
      v-show="variant !== 'tabs' || hasOverflow"
      class="shrink-0 items-center justify-center rounded-full border border-border-strong text-text-secondary hover:text-text-primary bg-surface transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
      :class="variant === 'tabs' ? 'flex size-10' : 'hidden sm:p-2 sm:flex'"
      type="button"
      aria-label="نمایش موارد بعدی"
      :disabled="!canScrollForward"
      @click="scrollByItem(-1)"
    >
      <UIcon :name="isRtl ? 'solar:arrow-left-broken' : 'solar:arrow-right-broken'" class="size-4" />
    </button>
  </div>
</template>
