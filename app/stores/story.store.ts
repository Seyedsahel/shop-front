import {storyService} from "~/services/story.service"
export const useStoryStore = defineStore('story', {
  state: () => ({
    items: [] as StoryItem[],
    isLoading: false,
    seenIds: new Set<string>(),
  }),
  actions: {
    async fetchStories() {
      this.isLoading = true
      try {
        const res = await storyService.getStories()
        this.items = res.items
        this.loadSeenFromStorage()
      } finally {
        this.isLoading = false
      }
    },

    loadSeenFromStorage() {
      const raw = localStorage.getItem('seen_stories')
      this.seenIds = raw ? new Set(JSON.parse(raw)) : new Set()
    },

    markSeen(id: string) {
      this.seenIds.add(id)
      localStorage.setItem('seen_stories', JSON.stringify([...this.seenIds]))
    },

    isSeen(id: string) {
      return this.seenIds.has(id)
    },
  },
})