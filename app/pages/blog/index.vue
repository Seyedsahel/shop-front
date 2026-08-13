<script setup lang="ts">
const blogStore = useBlogStore()
onMounted(() => blogStore.fetchPosts())
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <h1 class="text-lg sm:text-xl font-semibold text-text-primary mb-6">وبلاگ</h1>

    <div class="flex flex-col gap-4">
      <template v-if="blogStore.isLoading">
        <div v-for="n in 5" :key="n" class="h-28 rounded-2xl bg-loading animate-pulse" />
      </template>

      <BlogListItem v-else v-for="post in blogStore.items" :key="post.id" :post="post" />
    </div>
  </div>
</template>