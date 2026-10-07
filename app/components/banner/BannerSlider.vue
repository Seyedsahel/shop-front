<!-- app/components/banner/BannerSlider.vue -->
<script setup lang="ts">
const bannerStore = useBannerStore()

const active = ref(0)
const hovered = ref<number | null>(null)
const touchStart = ref<{ x: number, y: number } | null>(null)
let timer: ReturnType<typeof setInterval> | undefined

function start() {
  stop()
  if (bannerStore.homeTop.length < 2) return

  timer = setInterval(() => {
    goNext()
  }, 2000)
}
function stop() {
  if (timer) {
    clearInterval(timer)
    timer = undefined
  }
}
function goTo(i: number) {
  active.value = i
  start() // reset timer on manual interaction
}
function goNext() {
  goTo((active.value + 1) % bannerStore.homeTop.length)
}
function goPrevious() {
  goTo((active.value - 1 + bannerStore.homeTop.length) % bannerStore.homeTop.length)
}
function handleTouchStart(event: TouchEvent) {
  const touch = event.touches[0]
  if (touch) touchStart.value = { x: touch.clientX, y: touch.clientY }
}
function handleTouchEnd(event: TouchEvent) {
  const startPosition = touchStart.value
  const touch = event.changedTouches[0]
  touchStart.value = null
  if (!startPosition || !touch) return

  const deltaX = touch.clientX - startPosition.x
  const deltaY = touch.clientY - startPosition.y
  if (Math.abs(deltaX) < 50 || Math.abs(deltaX) <= Math.abs(deltaY)) return

  deltaX < 0 ? goNext() : goPrevious()
}

watch(() => bannerStore.homeTop.length, (len) => {
  if (len > 1) start()
})
onMounted(start)
onBeforeUnmount(stop)
</script>

<template>
  <section v-if="bannerStore.homeTop.length || bannerStore.isLoading" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div v-if="bannerStore.isLoading" class="w-full bg-loading aspect-video sm:aspect-21/7 rounded-2xl animate-pulse" />

    <div v-else class="w-full">
      <div
        class="relative w-full aspect-video sm:aspect-21/7 rounded-2xl overflow-hidden"
        @touchstart.passive="handleTouchStart"
        @touchend="handleTouchEnd"
      >
        <a
          v-for="(banner, i) in bannerStore.homeTop"
          :key="banner.id"
          :href="banner.href"
          class="absolute inset-0 transition-opacity duration-500"
          :class="i === active ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'"
          @mouseenter="stop"
          @mouseleave="start"
        >
          <img :src="banner.imageUrl" alt="" class="size-full object-cover" />
        </a>

        <button
          v-if="bannerStore.homeTop.length > 1"
          type="button"
          class="absolute inset-y-0 right-3 z-20 m-auto hidden size-10 items-center justify-center rounded-full bg-surface/90 text-text-primary shadow-sm transition-colors hover:bg-surface sm:flex"
          aria-label="بنر قبلی"
          @click="goPrevious"
        >
          <UIcon name="solar:arrow-right-broken" class="size-5" />
        </button>

        <button
          v-if="bannerStore.homeTop.length > 1"
          type="button"
          class="absolute inset-y-0 left-3 z-20 m-auto hidden size-10 items-center justify-center rounded-full bg-surface/90 text-text-primary shadow-sm transition-colors hover:bg-surface sm:flex"
          aria-label="بنر بعدی"
          @click="goNext"
        >
          <UIcon name="solar:arrow-left-broken" class="size-5" />
        </button>
      </div>

      <!-- Dots — manual navigation + hover preview -->
      <div v-if="bannerStore.homeTop.length > 1" class="flex justify-center gap-2 mt-3">
        <button
          v-for="(banner, i) in bannerStore.homeTop"
          :key="banner.id"
          type="button"
          class="size-2.5 rounded-full border transition-colors"
          :class="(i === active || i === hovered)
            ? 'bg-accent border-accent'
            : 'bg-transparent border-border-strong'"
          :aria-label="`اسلاید ${i + 1}`"
          @click="goTo(i)"
          @mouseenter="hovered = i"
          @mouseleave="hovered = null"
        />
      </div>
    </div>
  </section>
</template>
