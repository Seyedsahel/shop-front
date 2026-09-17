<script setup lang="ts">
const props = defineProps<{ targetType: CommentTargetType; targetId: string }>()
const commentStore = useCommentStore()

function fetchComments() {
  commentStore.fetchComments(props.targetType, props.targetId)
}

onMounted(fetchComments)
watch(() => [props.targetType, props.targetId], fetchComments)

const comments = computed(() => commentStore.byTarget[commentStore.keyFor(props.targetType, props.targetId)] ?? [])

const newComment = ref('')
async function submit() {
  const ok = await commentStore.submitComment(props.targetType, props.targetId, newComment.value)
  if (ok) newComment.value = ''
}
</script>

<template>
  <section class="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-text-primary">نظرات کاربران</h2>
        <p class="mt-1 text-xs text-text-muted">{{ comments.length.toLocaleString('fa-IR') }} دیدگاه ثبت شده</p>
      </div>
      <UIcon name="solar:chat-round-line-outline" class="size-6 text-primary" />
    </div>

    <form class="rounded-xl bg-surface p-3 sm:p-4" @submit.prevent="submit">
      <UiTextarea v-model="newComment" placeholder="نظر خود را بنویسید..." :rows="3" />
      <button
        type="submit"
        :disabled="commentStore.isSubmitting"
        class="mt-3 min-h-10 self-start rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {{ commentStore.isSubmitting ? 'در حال ارسال...' : 'ثبت نظر' }}
      </button>
    </form>

    <template v-if="commentStore.isLoading">
      <div v-for="n in 2" :key="n" class="h-24 rounded-xl bg-loading animate-pulse" />
    </template>
  

    <div v-else class="flex flex-col gap-3">
      <article v-for="comment in comments" :key="comment.id" class="rounded-xl border border-divider bg-surface p-4">
        <div class="mb-2 flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-text-primary">{{ comment.authorName }}</span>
          <span class="text-xs text-text-muted">{{ comment.createdAt }}</span>
        </div>
        <p class="text-sm leading-7 text-text-secondary">{{ comment.content }}</p>
      </article>
      <p v-if="!comments.length" class="rounded-xl bg-surface p-4 text-sm text-text-muted">هنوز نظری ثبت نشده است. اولین دیدگاه را شما بنویسید.</p>
    </div>
  </section>
</template>
