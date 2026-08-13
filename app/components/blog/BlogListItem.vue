<!-- app/components/blog/BlogListItem.vue -->
<script setup lang="ts">
const props = defineProps<{ post: BlogPost }>()

const formattedDate = computed(() =>
  new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(props.post.publishedAt))
)
</script>

<template>
  <NuxtLink
    :to="`/blog/${post.slug}`"
    class="flex gap-4 rounded-2xl border border-border-strong bg-surface p-3 hover:border-accent transition-colors"
  >
    <div class="w-28 sm:w-40 shrink-0 aspect-square rounded-xl overflow-hidden bg-surface-hover">
      <img :src="post.imageUrl" :alt="post.title" class="size-full object-cover" />
    </div>

    <div class="flex flex-col justify-center gap-2 min-w-0">
      <h3 class="text-sm sm:text-base font-semibold text-text-primary line-clamp-2">{{ post.title }}</h3>
      <p class="text-xs sm:text-sm text-text-secondary line-clamp-2">{{ post.excerpt }}</p>
      <span class="text-xs text-text-muted">{{ formattedDate }}</span>
    </div>
  </NuxtLink>
</template>