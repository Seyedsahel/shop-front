<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const storyStore = useStoryStore()
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
  await storyStore.fetchStories()
  if (!storyStore.items.some(story => story.id === id)) {
    try { await storyStore.fetchStory(id) } catch { await close() }
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

watch(storyId, loadStory, { immediate: true })
watch(current, story => { if (story) storyStore.markSeen(story.id) }, { immediate: true })
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
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
  <div v-else-if="isLoading" class="fixed inset-0 z-100 flex items-center justify-center bg-charcoal" role="status" aria-label="در حال بارگذاری استوری">
    <div class="size-10 animate-spin rounded-full border-2 border-pearl-white/30 border-t-pearl-white" />
  </div>
</template>
