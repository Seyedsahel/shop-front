<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const storyStore = useStoryStore()
const setStatus = usePageResponse()
const router = useRouter()
const detailOwner = storyStore.claimDetailOwner()
const detailPath = route.path
const removeNavigationHook = router.afterEach((to, _from, failure) => {
  if (!failure && to.path !== detailPath) storyStore.invalidateDetail(detailOwner)
})
onBeforeUnmount(() => { removeNavigationHook(); storyStore.invalidateDetail(detailOwner) })
const isClosing = ref(false)
const isNavigating = ref(false)
const storyId = computed(() => typeof route.params.id === 'string' ? route.params.id : '')
const currentIndex = computed(() => storyStore.items.findIndex(story => story.id === storyId.value))
const current = computed(() => storyStore.items[currentIndex.value])
const isLoading = computed(() => storyStore.isLoading || storyStore.isDetailLoading)
const fallbackPath = computed(() => {
  const from = route.query.from
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/'
})

async function loadStory(id: string) {
  if (!id) return
  storyStore.invalidateDetail(detailOwner)
  await storyStore.fetchStories()
  if (!storyStore.items.some(story => story.id === id)) {
    try { await storyStore.fetchStory(id, detailOwner) } catch (cause) {
      if (String(router.currentRoute.value.params.id) !== id) return
      const status = cause instanceof ApiError ? cause.status : undefined
      if (status === 404) {
        const missing = createError({ statusCode: 404, statusMessage: 'Story not found' })
        if (import.meta.server) throw missing
        showError(missing)
      } else setStatus(status ?? 503)
    }
  }
}
async function close() {
  if (isClosing.value) return
  isClosing.value = true
  await navigateTo(fallbackPath.value, { replace: true })
}
async function goTo(index: number) {
  if (isClosing.value || isNavigating.value) return
  const target = storyStore.items[index]
  if (!target) return close()
  isNavigating.value = true
  try {
    await navigateTo({ path: `/stories/${target.id}`, query: { from: fallbackPath.value } }, { replace: true })
  } finally {
    isNavigating.value = false
  }
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
  else if (event.key === 'ArrowLeft') goTo(currentIndex.value + 1)
  else if (event.key === 'ArrowRight') goTo(currentIndex.value - 1)
}

watch(storyId, loadStory)
watch(current, story => { if (import.meta.client && story) storyStore.markSeen(story.id) })
onMounted(() => { storyStore.loadSeenFromStorage(); if (current.value) storyStore.markSeen(current.value.id); window.addEventListener('keydown', onKeydown) })
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
usePageSeo(() => current.value?.title ?? 'استوری', () => current.value?.title ?? '')
await callOnce(`story:${storyId.value}`, () => loadStory(storyId.value), { mode: 'navigation' })
</script>

<template>
  <StoriesStoryViewer
    v-if="current && !isClosing"
    :story="current"
    :index="currentIndex"
    :total="storyStore.items.length"
    @close="close"
    @next="goTo(currentIndex + 1)"
    @prev="goTo(currentIndex - 1)"
  />
  <div v-else-if="storyStore.error" role="alert" class="p-8">{{ storyStore.error.message }} <button type="button" @click="loadStory(storyId)">تلاش دوباره</button></div>
  <div v-else-if="isLoading" class="fixed inset-0 z-100 flex items-center justify-center bg-charcoal" role="status" aria-label="در حال بارگذاری استوری">
    <div class="size-10 animate-spin rounded-full border-2 border-pearl-white/30 border-t-pearl-white" />
  </div>
</template>
