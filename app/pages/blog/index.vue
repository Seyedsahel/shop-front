<script setup lang="ts">
const blogStore = useBlogStore()
const setStatus = usePageResponse()
await callOnce('blog:list', async () => { if (!(await blogStore.fetchPosts())) setStatus(blogStore.error?.status ?? 503) }, { mode: 'navigation' })
usePageSeo('وبلاگ', 'تازه‌ترین مقالات فروشگاه.')
const isEmpty = computed(() => blogStore.loaded && !blogStore.isLoading && !blogStore.error && !blogStore.items.length)
</script>

<template>
  <div class="mx-auto px-4 sm:px-6 lg:px-8 py-10" :class="isEmpty ? 'max-w-5xl' : 'max-w-3xl'">
    <h1 class="text-lg sm:text-xl font-semibold text-text-primary mb-6">وبلاگ</h1>

    <div v-if="blogStore.error" role="alert" class="mb-4 text-danger">{{ blogStore.error.message }} <button type="button" class="underline" @click="blogStore.fetchPosts(true)">تلاش دوباره</button></div>
    <BlogEmptyState v-else-if="isEmpty" />
    <div class="flex flex-col gap-4">
      <template v-if="blogStore.isLoading">
        <div v-for="n in 5" :key="n" class="h-28 rounded-2xl bg-loading animate-pulse" />
      </template>

      <BlogListItem v-else v-for="post in blogStore.items" :key="post.id" :post="post" />
    </div>
  </div>
</template>
