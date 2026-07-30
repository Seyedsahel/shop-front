<script setup lang="ts">
const props = defineProps<{ post: BlogPost }>()

const formattedDate = computed(() =>
//   new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(props.post.publishedAt))
    props.post.publishedAt
)
</script>

<template>
  <article
    class="flex h-full flex-col overflow-hidden rounded-2xl border border-border-strong bg-surface transition-all hover:-translate-y-1 hover:shadow-lg"
  >
    <NuxtLink :to="`/blog/${post.slug}`" class="block aspect-video bg-surface-hover">
      <img
        :src="post.imageUrl"
        :alt="post.title"
        class="size-full object-cover transition-transform duration-300 hover:scale-105"
      />
    </NuxtLink>

    <div class="flex flex-1 flex-col p-4">
      <NuxtLink
        :to="`/blog/${post.slug}`"
        class="text-base font-semibold text-text-primary line-clamp-2"
      >
        {{ post.title }}
      </NuxtLink>

      <p class="mt-3 text-sm text-text-secondary line-clamp-3">
        {{ post.excerpt }}
      </p>

      <NuxtLink
        :to="`/blog/${post.slug}`"
        class="mt-auto pt-5 text-sm font-medium text-accent hover:underline"
      >
        مشاهده بیشتر ←
      </NuxtLink>

      <div class="mt-4 border-t border-border pt-3">
        <span class="text-xs text-text-muted">
          {{ formattedDate }}
        </span>
      </div>
    </div>
  </article>
</template>