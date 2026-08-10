<!-- app/pages/stories/[id].vue -->
<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const storyStore = useStoryStore()

onMounted(async () => {
  if (!storyStore.items.length)
   await storyStore.fetchStories()
})

const currentIndex = computed(() =>
  storyStore.items.findIndex(s => s.id === route.params.id)
)
const current = computed(() => storyStore.items[currentIndex.value])

function goTo(index: number) {
  const target = storyStore.items[index]
  if (!target) {
    navigateTo('/') // ran off either end
    return
  }
  navigateTo(`/stories/${target.id}`, { replace: true })
}

function next() { goTo(currentIndex.value + 1) }
function prev() { goTo(currentIndex.value - 1) }

watch(current, (story) => {
  if (story) storyStore.markSeen(story.id)
}, { immediate: true })

// --- Auto-advance with progress ---
const STORY_DURATION_MS = 5000
const progress = ref(0) // 0 to 1, current story's fill
let frame: number | undefined
let startedAt = 0
let pausedElapsed = 0
let isPaused = false

function tick(now: number) {
  if (isPaused) return
  const elapsed = pausedElapsed + (now - startedAt)
  progress.value = Math.min(elapsed / STORY_DURATION_MS, 1)
  if (progress.value >= 1) {
    next()
    return
  }
  frame = requestAnimationFrame(tick)
}

function startProgress() {
  cancelAnimationFrame(frame ?? 0)
  progress.value = 0
  pausedElapsed = 0
  isPaused = false
  startedAt = performance.now()
  frame = requestAnimationFrame(tick)
}

function pause() {
  if (isPaused) return
  isPaused = true
  pausedElapsed += performance.now() - startedAt
}

function resume() {
  if (!isPaused) return
  isPaused = false
  startedAt = performance.now()
  frame = requestAnimationFrame(tick)
}

watch(current, () => startProgress(), { immediate: true })
onBeforeUnmount(() => cancelAnimationFrame(frame ?? 0))

// --- Swipe handling ---
let startX = 0
let startY = 0
const SWIPE_THRESHOLD = 50

function onTouchStart(e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch) return
  startX = touch.clientX
  startY = touch.clientY
  pause()
}

function onTouchEnd(e: TouchEvent) {
  const touch = e.changedTouches[0]
  if (!touch) return
  const dx = touch.clientX - startX
  const dy = touch.clientY - startY

  if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dx) >= SWIPE_THRESHOLD) {
    dx < 0 ? next() : prev()
  } else {
    resume()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') next()
  if (e.key === 'ArrowRight') prev()
  if (e.key === 'Escape') navigateTo('/')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div
    v-if="current"
    class="fixed inset-0 z-100 bg-charcoal flex items-center justify-center overflow-hidden"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
    @mousedown="pause"
    @mouseup="resume"
  >
    <img :src="current.mediaUrl" alt="" class="absolute inset-0 size-full object-cover blur-2xl scale-110 opacity-60" />
    <img :src="current.mediaUrl" :alt="current.title" class="relative z-10 max-h-full max-w-full object-contain" />

    <!-- Progress segments -->
    <div class="absolute top-3 inset-x-3 z-20 flex gap-1.5">
      <div
        v-for="(item, i) in storyStore.items"
        :key="item.id"
        class="h-1 flex-1 rounded-full bg-pearl-white/30 overflow-hidden"
      >
        <div
          class="h-full bg-border-strong transition-all duration-100"
          :style="{
            width: i < currentIndex ? '100%' : i === currentIndex ? `${progress * 100}%` : '0%'
          }"
        />
      </div>
    </div>

    <!-- Title bar -->
    <div class="absolute top-7 inset-x-0 z-20 ">
        <h1 class="text-accent-foreground font-medium text-sm text-center">
          {{ current.title }}
        </h1>
      <button class="absolute top-1/2 inset-e-4 -translate-y-1/2 text-accent-foreground" @click="navigateTo('/')">
        <UIcon name="solar:close-circle-broken" class="size-6" />
      </button>
    </div>

    <button
      v-if="currentIndex < storyStore.items.length - 1"
      class="hidden sm:flex absolute top-1/2 -translate-y-1/2 inset-s-3 z-20 size-9 rounded-full bg-charcoal/40 text-pearl-white items-center justify-center"
      @click="next"
    >
      <UIcon name="solar:arrow-left-broken" class="size-5" />
    </button>
    <button
      v-if="currentIndex > 0"
      class="hidden sm:flex absolute top-1/2 -translate-y-1/2 inset-e-3 z-20 size-9 rounded-full bg-charcoal/40 text-pearl-white items-center justify-center"
      @click="prev"
    >
      <UIcon name="solar:arrow-right-broken" class="size-5" />
    </button>
  </div>

  <div v-else-if="storyStore.isLoading" class="fixed inset-0 z-100 bg-charcoal flex items-center justify-center">
    <div class="size-10 rounded-full border-2 border-pearl-white/30 border-t-pearl-white animate-spin" />
  </div>
</template>