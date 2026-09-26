export default defineEventHandler(async (event): Promise<StoriesResponse> => {
  const stories = await backendFetch<StoryApiItem[]>('/api/stories', { authorization: 'none' }, event)
  return { items: stories.map(mapStory) }
})
