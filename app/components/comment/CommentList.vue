<script setup lang="ts">
const props = defineProps<{ targetType: CommentTargetType; targetId: string }>()
const commentStore = useCommentStore()

function fetchComments(force = false) {
  return commentStore.fetchComments(props.targetType, props.targetId, force)
}

await callOnce(`comments:${props.targetType}:${props.targetId}`, () => fetchComments(), { mode: 'navigation' })
watch(() => [props.targetType, props.targetId], () => fetchComments())

const comments = computed(() => {
  const key = commentStore.keyFor(props.targetType, props.targetId)
  return [...(commentStore.pendingByTarget[key] ?? []), ...(commentStore.byTarget[key] ?? [])]
})

const newComment = ref('')
const commentError = ref('')
const validateCommentText = (value: string) => value.trim() ? '' : 'متن نظر نمی‌تواند خالی باشد.'
const replyingTo = ref<AppComment | null>(null)
watch(newComment, () => { if (commentError.value) commentError.value = validateCommentText(newComment.value) })
watch(() => [props.targetType, props.targetId], () => {
  newComment.value = ''
  commentError.value = ''
  replyingTo.value = null
})

async function submit() {
  if (commentStore.isSubmitting) return
  commentError.value = validateCommentText(newComment.value)
  if (commentError.value) return
  const input = parseCommentInput({ targetType: props.targetType, targetId: props.targetId, content: newComment.value, parentId: replyingTo.value?.id })
  if (!input) {
    commentError.value = 'اطلاعات نظر معتبر نیست؛ صفحه را دوباره بارگذاری کنید.'
    return
  }
  const ok = await commentStore.submitComment(input.targetType, input.targetId, input.content, input.parentId)
  if (ok) {
    newComment.value = ''
    commentError.value = ''
    replyingTo.value = null
  }
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
      <div v-if="replyingTo" class="mb-3 flex items-center justify-between gap-3 text-sm text-text-secondary">
        <span>پاسخ به {{ replyingTo.authorName }}</span>
        <button type="button" class="text-primary hover:underline" @click="replyingTo = null">لغو پاسخ</button>
      </div>
      <UiTextarea v-model="newComment" v-model:error="commentError" :validate="validateCommentText" placeholder="نظر خود را بنویسید..." :rows="3" />
      <button
        type="submit"
        :disabled="commentStore.isSubmitting"
        class="mt-3 min-h-10 self-start rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {{ commentStore.isSubmitting ? 'در حال ارسال...' : 'ثبت نظر' }}
      </button>
    </form>

    <p v-if="commentStore.errors[commentStore.keyFor(targetType, targetId)]" role="alert" class="text-sm text-danger">{{ commentStore.errors[commentStore.keyFor(targetType, targetId)] }} <button type="button" class="underline" @click="fetchComments(true)">تلاش دوباره</button></p>
    <template v-if="commentStore.isLoading && !comments.length">
      <div v-for="n in 2" :key="n" class="h-24 rounded-xl bg-loading animate-pulse" />
    </template>
  

    <div v-else class="flex flex-col gap-3">
      <article v-for="comment in comments" :key="comment.id" class="rounded-xl border border-divider bg-surface p-4">
        <div class="mb-2 flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-text-primary">{{ comment.authorName }}</span>
            <UiBadge v-if="comment.pending">در انتظار تأیید</UiBadge>
          </div>
          <span class="text-xs text-text-muted">{{ comment.createdAt }}</span>
        </div>
        <p v-if="comment.parentId" class="mb-2 text-xs text-text-muted">
          پاسخ به {{ comments.find(item => item.id === comment.parentId)?.authorName ?? 'نظر دیگر' }}
        </p>
        <p class="text-sm leading-7 text-text-secondary">{{ comment.content }}</p>
        <button type="button" class="mt-2 text-xs text-primary hover:underline" @click="replyingTo = comment">پاسخ</button>
      </article>
      <p v-if="!comments.length" class="rounded-xl bg-surface p-4 text-sm text-text-muted">هنوز نظری ثبت نشده است. اولین دیدگاه را شما بنویسید.</p>
    </div>
  </section>
</template>
