export default defineEventHandler(async (event): Promise<StoryItem> => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Story ID is required' })

  const story = await backendFetch<StoryApiItem>(`/stories/${encodeURIComponent(id)}`, { authorization: 'none' }, event)
  return mapStory(story)
})
