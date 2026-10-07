<script setup lang="ts">
const stories = useStoryStore()
const setStatus = usePageResponse()
await callOnce('stories:list', async () => { if (!(await stories.fetchStories())) setStatus(stories.error?.status ?? 503) }, { mode: 'navigation' })
onMounted(() => stories.loadSeenFromStorage())
usePageSeo('استوری‌ها', 'استوری‌های فروشگاه.')
</script>
<template>
  <div class="mx-auto max-w-7xl px-4 py-10">
    <h1 class="mb-6 text-xl font-semibold">استوری‌ها</h1>
    <div v-if="stories.error" role="alert">{{ stories.error.message }} <button type="button" @click="stories.fetchStories(true)">تلاش دوباره</button></div>
    <p v-else-if="!stories.items.length">استوری‌ای برای نمایش وجود ندارد.</p>
    <div v-else class="flex flex-wrap gap-5"><StoriesStoryItem v-for="item in stories.items" :key="item.id" :item="item" :thumbnail-url="item.thumbnailUrl" /></div>
  </div>
</template>
