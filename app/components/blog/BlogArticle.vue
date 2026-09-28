<script setup lang="ts">
defineProps<{ post: BlogPostDetail }>()
</script>

<template>
  <article class="space-y-8">
    <section v-for="(block, index) in post.blocks" :key="`${block.type}-${block.sortOrder}-${index}`" class="space-y-6">
      <template v-if="block.type === 'text'">
        <h2 v-if="block.title" class="mb-3 text-lg font-semibold text-text-primary sm:text-xl">{{ block.title }}</h2>
        <p class="whitespace-pre-line text-sm leading-8 text-text-secondary sm:text-base">{{ block.body }}</p>
      </template>

      <figure v-else-if="block.type === 'image'" class="overflow-hidden rounded-2xl border border-border bg-surface">
        <div class="aspect-video w-full bg-surface-hover">
          <img v-if="block.imageUrl" :src="block.imageUrl" :alt="block.title || post.title" class="size-full object-cover" loading="lazy">
        </div>
        <figcaption v-if="block.title" class="px-4 py-3 text-sm text-text-secondary">{{ block.title }}</figcaption>
      </figure>

      <blockquote v-else-if="block.type === 'quote'" class="rounded-2xl border-s-4 border-primary bg-surface px-5 py-4">
        <h2 v-if="block.title" class="mb-2 text-base font-semibold text-text-primary">{{ block.title }}</h2>
        <p class="whitespace-pre-line text-base leading-8 text-text-secondary">{{ block.body }}</p>
      </blockquote>

      <section v-else-if="block.type === 'video'" class="overflow-hidden rounded-2xl border border-border bg-surface">
        <div class="aspect-video w-full bg-black">
          <video v-if="block.videoUrl" controls preload="metadata" class="blog-video size-full object-cover" :aria-label="block.title || post.title">
            <source :src="block.videoUrl">
            مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
          </video>
        </div>
        <div v-if="block.title || block.body" class="p-4">
          <h2 v-if="block.title" class="text-base font-semibold text-text-primary">{{ block.title }}</h2>
          <p v-if="block.body" class="mt-2 whitespace-pre-line text-sm leading-7 text-text-secondary">{{ block.body }}</p>
        </div>
      </section>

      <section v-else-if="block.type === 'faq'" class="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 v-if="block.title" class="mb-3 text-lg font-semibold text-text-primary">{{ block.title }}</h2>
        <div class="divide-y divide-border">
          <details v-for="(item, itemIndex) in block.items" :key="`${item.title}-${itemIndex}`" class="group py-3">
            <summary class="cursor-pointer list-none font-medium text-text-primary">{{ item.title }}</summary>
            <p class="mt-3 whitespace-pre-line text-sm leading-7 text-text-secondary">{{ item.body }}</p>
          </details>
        </div>
      </section>

      <section v-else-if="block.type === 'table'" class="overflow-hidden rounded-2xl border border-border bg-surface">
        <h2 v-if="block.title" class="border-b border-border px-4 py-3 text-lg font-semibold text-text-primary">{{ block.title }}</h2>
        <div class="overflow-x-auto">
          <table class="w-full min-w-96 text-right text-sm">
            <tbody class="divide-y divide-border">
              <tr v-for="(item, itemIndex) in block.items" :key="`${item.title}-${itemIndex}`">
                <th scope="row" class="w-1/3 bg-surface-hover px-4 py-3 font-medium text-text-primary">{{ item.title }}</th>
                <td class="whitespace-pre-line px-4 py-3 leading-7 text-text-secondary">{{ item.body }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>
  </article>
</template>

<style scoped>
.blog-video:fullscreen,
.blog-video:-webkit-full-screen {
  background: #000;
  object-fit: contain;
}
</style>
