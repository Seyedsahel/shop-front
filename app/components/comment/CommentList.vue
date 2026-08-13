<script setup lang="ts">
const props = defineProps<{ targetType: CommentTargetType; targetId: string }>()
const commentStore = useCommentStore()

onMounted(() => commentStore.fetchComments(props.targetType, props.targetId))

const comments = computed(() => commentStore.byTarget[commentStore.keyFor(props.targetType, props.targetId)] ?? [])

const newComment = ref('')
async function submit() {
  const ok = await commentStore.submitComment(props.targetType, props.targetId, newComment.value)
  if (ok) newComment.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-5 border border-disabled-border rounded-2xl shadow-sm p-5">
    <h2 class="text-sm font-semibold text-text-primary">نظرات ({{ comments.length }})</h2>

    <form class="flex flex-col gap-3" @submit.prevent="submit">
      <UiTextarea v-model="newComment" placeholder="نظر خود را بنویسید..." :rows="3" />
      <button
        type="submit"
        :disabled="commentStore.isSubmitting"
        class="self-start bg-secondary hover:bg-secondary/80 disabled:opacity-50 text-text-on-dark py-2 px-8 rounded-xl transition-colors text-sm"
      >
        {{ commentStore.isSubmitting ? 'در حال ارسال...' : 'ثبت نظر' }}
      </button>
    </form>

    <template v-if="commentStore.isLoading">
      <div v-for="n in 2" :key="n" class="h-16 rounded-xl bg-loading animate-pulse" />
    </template>
  

    <div v-else class="flex flex-col gap-4">
      <div v-for="comment in comments" :key="comment.id" class="border-t border-divider pt-4">
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm font-medium text-text-primary">{{ comment.authorName }}</span>
          <span class="text-xs text-text-muted">{{ comment.createdAt }}</span>
        </div>
        <p class="text-sm text-text-secondary">{{ comment.content }}</p>
      </div>
      <p v-if="!comments.length" class="text-sm text-text-muted">هنوز نظری ثبت نشده است.</p>
    </div>
  </div>
</template>