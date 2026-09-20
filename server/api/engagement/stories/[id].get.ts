export default defineEventHandler(async (event): Promise<StoryItem> => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Story id is required' })

  const story = await backendFetch<StoryApiItem>(`/api/stories/${encodeURIComponent(id)}`, { authorization: 'none' }, event)
  if (!isAvailableStory(story)) throw createError({ statusCode: 404, statusMessage: 'Story not found' })

  return mapStory(story)
})
