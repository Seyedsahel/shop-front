<script setup lang="ts">
const storyStore = useStoryStore()

onMounted(() => {
  storyStore.fetchStories()
})
</script>

<template>
  <section v-if="storyStore.items.length || storyStore.isLoading" class="w-full h-22 border-b border-divider bg-surface">
    <div class="h-full w-full flex items-center gap-4 px-4 sm:px-6 lg:px-8 overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
      <template v-if="storyStore.isLoading">
        <div v-for="n in 6" :key="n" class="size-16 rounded-full bg-surface-hover animate-pulse shrink-0" />
      </template>

      <StoriesStoryItem
        v-else
        v-for="item in storyStore.items"
        :key="item.id"
        :item="item"
        :thumbnail-url="item.thumbnailUrl"
      />
    </div>
  </section>
</template>