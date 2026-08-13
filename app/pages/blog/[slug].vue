<script setup lang="ts">
const route = useRoute()
const blogStore = useBlogStore()

onMounted(async () => {
  if (!blogStore.items.length) await blogStore.fetchPosts()
})

const post = computed(() => blogStore.items.find(p => p.slug === route.params.slug))

const formattedDate = computed(() =>
  post.value ? new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(post.value.publishedAt)) : ''
)
</script>

<template>
  <div v-if="post" class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <img :src="post.imageUrl" :alt="post.title" class="w-full aspect-video object-cover rounded-2xl mb-6" />
    <span class="text-xs text-text-muted">{{ formattedDate }}</span>
    <h1 class="text-xl sm:text-2xl font-semibold text-text-primary mt-2 mb-4">{{ post.title }}</h1>
    <p class="text-sm sm:text-base text-text-secondary leading-8 mb-10">{{ post.content }}</p>

    <CommentList target-type="blog" :target-id="post.id" />
  </div>

  <div v-else-if="blogStore.isLoading" class="max-w-3xl mx-auto px-4 py-10">
    <div class="h-64 rounded-2xl bg-loading animate-pulse" />
  </div>
</template>