export const storyService = {
  getStories: () => apiFetch<StoriesResponse>('/engagement/stories'),
}