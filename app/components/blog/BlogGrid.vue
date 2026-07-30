<script setup lang="ts">
const blogStore = useBlogStore()
onMounted(() => blogStore.fetchPosts())

const posts = computed(() => blogStore.items.slice(0, 3))
</script>

<template>
  <section class="max-w-dvw mx-auto px-4 sm:px-6 lg:px-32 py-10">
    <div class="flex justify-center items-center mb-7">
        <h2 class="text-lg sm:text-xl font-semibold text-text-primary mb-6">از وبلاگ ما</h2>
    </div>


    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <template v-if="blogStore.isLoading">
        <div v-for="n in 3" :key="n" class="h-40 rounded-2xl bg-loading animate-pulse" />
      </template>

      <BlogCard v-else v-for="post in posts" :key="post.id" :post="post" />
    </div>
  </section>
</template>