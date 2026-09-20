<script setup lang="ts">
const props = defineProps<{ story: StoryItem; index: number; total: number }>()
const emit = defineEmits<{ close: []; next: []; prev: [] }>()

const IMAGE_DURATION_MS = 5_000
const video = ref<HTMLVideoElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
const progress = ref(0)
const paused = ref(false)
const mediaError = ref(false)
const mediaKey = ref(0)
let frame: number | undefined
let startedAt = 0
let pausedElapsed = 0
let previousOverflow = ''
let previousFocus: HTMLElement | null = null
let pointerStartX = 0
let pointerStartY = 0

function stopProgress() { if (frame !== undefined) cancelAnimationFrame(frame); frame = undefined }
function advanceFrame(now: number) {
  if (paused.value) return
  if (props.story.mediaType === 'video') {
    const player = video.value
    if (player?.duration && Number.isFinite(player.duration)) progress.value = Math.min(player.currentTime / player.duration, 1)
  } else {
    progress.value = Math.min((pausedElapsed + now - startedAt) / IMAGE_DURATION_MS, 1)
    if (progress.value >= 1) { emit('next'); return }
  }
  frame = requestAnimationFrame(advanceFrame)
}
function startProgress() {
  stopProgress(); progress.value = 0; paused.value = false; pausedElapsed = 0; startedAt = performance.now()
  if (props.story.mediaType === 'image') frame = requestAnimationFrame(advanceFrame)
}
function onVideoReady() {
  if (paused.value) return
  video.value?.play().catch(() => { mediaError.value = true })
  stopProgress(); frame = requestAnimationFrame(advanceFrame)
}
function onImageReady() { startProgress() }
function pause() {
  if (paused.value) return
  paused.value = true
  if (props.story.mediaType === 'video') video.value?.pause()
  else pausedElapsed += performance.now() - startedAt
  stopProgress()
}
function resume() {
  if (!paused.value || mediaError.value) return
  paused.value = false
  if (props.story.mediaType === 'video') video.value?.play().catch(() => { mediaError.value = true })
  else { startedAt = performance.now(); frame = requestAnimationFrame(advanceFrame) }
}
function onVisibilityChange() { if (document.hidden) pause() }
function onPointerDown(event: PointerEvent) {
  pointerStartX = event.clientX
  pointerStartY = event.clientY
  pause()
}
function onPointerUp(event: PointerEvent) {
  const deltaX = event.clientX - pointerStartX
  const deltaY = event.clientY - pointerStartY
  if (Math.abs(deltaX) >= 50 && Math.abs(deltaX) >= Math.abs(deltaY)) {
    if (deltaX < 0) emit('next')
    else emit('prev')
    return
  }
  resume()
}
function onMediaError() { mediaError.value = true; pause() }
function retryMedia() {
  mediaError.value = false
  mediaKey.value += 1
  if (props.story.mediaType === 'image') return
  video.value?.load()
}

watch(() => props.story.id, () => {
  stopProgress()
  progress.value = 0
  paused.value = false
  pausedElapsed = 0
  mediaError.value = false
  mediaKey.value += 1
}, { immediate: true })
onMounted(async () => {
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  document.addEventListener('visibilitychange', onVisibilityChange)
  await nextTick()
  closeButton.value?.focus()
})
onBeforeUnmount(() => {
  stopProgress()
  video.value?.pause()
  document.body.style.overflow = previousOverflow
  document.removeEventListener('visibilitychange', onVisibilityChange)
  previousFocus?.focus()
})
</script>

<template>
  <div class="fixed inset-0 z-100 flex items-center justify-center overflow-hidden bg-charcoal" role="dialog" aria-modal="true" :aria-label="`استوری ${story.title}`" @pointerdown="onPointerDown" @pointerup="onPointerUp" @pointercancel="resume">
    <img v-if="story.mediaType === 'image'" :key="`background-${mediaKey}`" :src="story.mediaUrl" alt="" class="absolute inset-0 size-full scale-110 object-cover opacity-60 blur-2xl" />
    <img v-if="story.mediaType === 'image'" :key="`image-${mediaKey}`" :src="story.mediaUrl" :alt="story.title" class="relative z-10 max-h-full max-w-full object-contain" @load="onImageReady" @error="onMediaError">
    <video v-else :key="mediaKey" ref="video" class="relative z-10 max-h-full max-w-full object-contain" :poster="story.thumbnailUrl" :aria-label="story.title" autoplay playsinline preload="metadata" @loadedmetadata="onVideoReady" @ended="emit('next')" @error="onMediaError">
      <source :src="story.mediaUrl" type="video/mp4">
    </video>

    <div class="absolute top-3 inset-x-3 z-20 flex gap-1.5" aria-hidden="true">
      <div v-for="itemIndex in total" :key="itemIndex" class="h-1 flex-1 overflow-hidden rounded-full bg-accent/30">
        <div class="h-full bg-accent transition-[width] duration-100" :style="{ width: itemIndex - 1 < index ? '100%' : itemIndex - 1 === index ? `${progress * 100}%` : '0%' }" />
      </div>
    </div>

    <div class="absolute top-7 inset-x-0 z-20 flex items-center justify-center px-14">
      <h1 class="text-center text-sm font-medium text-accent-foreground">{{ story.title }}</h1>
      <button ref="closeButton" type="button" aria-label="بستن استوری" class="absolute inset-e-4 grid size-10 place-items-center rounded-full text-accent-foreground focus-visible:outline-2 focus-visible:outline-pearl-white" @pointerdown.stop @pointerup.stop @click.stop="emit('close')"><UIcon name="solar:close-circle-broken" class="size-6" /></button>
    </div>

    <template v-if="!mediaError">
      <button v-if="index > 0" type="button" aria-label="استوری قبلی" class="absolute inset-y-0 start-0 z-20 w-1/3 cursor-w-resize" @pointerdown.stop @pointerup.stop @click.stop="emit('prev')" />
      <button v-if="index < total - 1" type="button" aria-label="استوری بعدی" class="absolute inset-y-0 end-0 z-20 w-1/3 cursor-e-resize" @pointerdown.stop @pointerup.stop @click.stop="emit('next')" />
    </template>
    <div v-else class="absolute z-30 flex flex-col items-center gap-3 rounded-xl bg-charcoal/80 p-5 text-center text-pearl-white"><p>بارگذاری استوری ناموفق بود.</p><button type="button" class="rounded-lg bg-pearl-white px-4 py-2 text-charcoal" @click.stop="retryMedia">تلاش دوباره</button></div>
  </div>
</template>
