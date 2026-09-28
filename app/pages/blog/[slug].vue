<script setup lang="ts">
const route = useRoute()
const blogStore = useBlogStore()

const slug = computed(() => typeof route.params.slug === 'string' ? route.params.slug : '')
const post = computed(() => blogStore.current?.slug === slug.value ? blogStore.current : null)

async function fetchPost() {
  if (!slug.value) return
  try {
    await blogStore.fetchPost(slug.value)
  } catch {
    // The page presents the normalized store error below.
  }
}

const formattedDate = computed(() =>
  post.value ? new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(post.value.publishedAt * 1000)) : ''
)

onMounted(fetchPost)
watch(slug, fetchPost)
</script>

<template>
  <div v-if="post" class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <img v-if="post.thumbnailUrl" :src="post.thumbnailUrl" :alt="post.title" class="w-full aspect-video object-cover rounded-2xl mb-6" />
    <span class="text-xs text-text-muted">{{ formattedDate }}</span>
    <h1 class="text-xl sm:text-2xl font-semibold text-text-primary mt-2 mb-4">{{ post.title }}</h1>
    <p v-if="post.summary" class="mb-10 whitespace-pre-line text-sm leading-8 text-text-secondary sm:text-base">{{ post.summary }}</p>

    <BlogArticle :post="post" />

    <CommentList class="mt-10" target-type="post" :target-id="post.id" />
  </div>

  <div v-else-if="blogStore.isDetailLoading" class="max-w-3xl mx-auto px-4 py-10">
    <div class="h-64 rounded-2xl bg-loading animate-pulse" />
  </div>

  <div v-else class="max-w-3xl mx-auto px-4 py-10 text-sm text-text-secondary">
    {{ blogStore.error?.message ?? 'مقاله موردنظر پیدا نشد.' }}
  </div>
</template>
