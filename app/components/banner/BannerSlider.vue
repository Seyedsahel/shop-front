<!-- app/components/banner/BannerSlider.vue -->
<script setup lang="ts">
const bannerStore = useBannerStore()
onMounted(() => bannerStore.fetchBanners())

const active = ref(0)
const hovered = ref<number | null>(null)
let timer: ReturnType<typeof setInterval> | undefined

function start() {
  stop()
  timer = setInterval(() => {
    active.value = (active.value + 1) % bannerStore.slider.length
  }, 2000)
}
function stop() {
  if (timer) clearInterval(timer)
}
function goTo(i: number) {
  active.value = i
  start() // reset timer on manual interaction
}

watch(() => bannerStore.slider.length, (len) => {
  if (len > 1) start()
})
onBeforeUnmount(stop)
</script>

<template>
  <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div v-if="bannerStore.isLoading" class="w-full bg-loading aspect-video sm:aspect-21/7 rounded-2xl bg-surface-hover animate-pulse" />

    <div v-else class="w-full">
      <div class="relative w-full aspect-video sm:aspect-21/7 rounded-2xl overflow-hidden">
        <a
          v-for="(banner, i) in bannerStore.slider"
          :key="banner.id"
          :href="banner.href"
          class="absolute inset-0 transition-opacity duration-500"
          :class="i === active ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'"
          @mouseenter="stop"
          @mouseleave="start"
        >
          <img :src="banner.imageUrl" alt="" class="size-full object-cover" />
        </a>
      </div>

      <!-- Dots — manual navigation + hover preview -->
      <div v-if="bannerStore.slider.length > 1" class="flex justify-center gap-2 mt-3">
        <button
          v-for="(banner, i) in bannerStore.slider"
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