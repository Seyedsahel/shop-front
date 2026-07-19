<script setup lang="ts">
const props = defineProps<{ item: StoryItem; thumbnailUrl: string; }>()
const storyStore = useStoryStore()

const seen = computed(() => storyStore.isSeen(props.item.id))

const open = () => {
  storyStore.markSeen(props.item.id)
  // navigate to full-screen story viewer, e.g. navigateTo(`/stories/${props.item.id}`)
}
</script>

<template>
  <button class="flex flex-col items-center shrink-0 w-16 snap-start" @click="open">
    <div class="size-16 rounded-full p-0.5" :class="seen ? 'bg-border-strong' : 'bg-accent'">
      <div class="size-full rounded-full p-0.5 bg-background">
        <img :src="thumbnailUrl" alt="Fateme Beauty Lab" class="size-full rounded-full object-cover mb-1" />
      </div>
    </div>
    <span class="text-xs text-text-secondary">{{ item.title }}</span>
  </button>
</template>