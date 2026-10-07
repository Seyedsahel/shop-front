<script setup lang="ts">
const route = useRoute()
const blogStore = useBlogStore()
const setStatus = usePageResponse()
const router = useRouter()

const detailOwner = blogStore.claimDetailOwner()
const detailPath = route.path
const removeNavigationHook = router.afterEach((to, _from, failure) => {
  if (!failure && to.path !== detailPath) blogStore.invalidateDetail(detailOwner)
})
onBeforeUnmount(() => { removeNavigationHook(); blogStore.invalidateDetail(detailOwner) })
const slug = computed(() => typeof route.params.slug === 'string' ? route.params.slug : '')
const post = computed(() => blogStore.current?.slug === slug.value ? blogStore.current : null)

async function fetchPost() {
  const requestedSlug = slug.value
  if (!requestedSlug) return
  try {
    await blogStore.fetchPost(requestedSlug, detailOwner)
  } catch (cause) {
    if (String(router.currentRoute.value.params.slug) !== requestedSlug) return
    const status = cause instanceof ApiError ? cause.status : undefined
    if (status === 404) {
      const missing = createError({ statusCode: 404, statusMessage: 'Article not found' })
      if (import.meta.server) throw missing
      showError(missing)
    } else setStatus(status ?? 503)
  }
}

const formattedDate = computed(() =>
  post.value ? new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Tehran' }).format(new Date(post.value.publishedAt * 1000)) : ''
)

usePageSeo(() => post.value?.title ?? 'مقاله', () => post.value?.summary ?? '')
await callOnce(`article:${slug.value}`, fetchPost, { mode: 'navigation' })
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
    <p role="alert">{{ blogStore.detailError?.message ?? 'مقاله موردنظر پیدا نشد.' }}</p><button type="button" class="mt-3 underline" @click="fetchPost">تلاش دوباره</button>
  </div>
</template>
