export default defineEventHandler(async (event): Promise<StoryItem> => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Story ID is required' })

  const story = await backendFetch<StoryApiItem>(`/stories/${encodeURIComponent(id)}`, { authorization: 'none' }, event)
  if (Array.isArray(story) && story.length === 0) throw createError({ statusCode: 404, message: 'Story not found' })
  if (!story || typeof story !== 'object' || typeof story.id !== 'string') throw createError({ statusCode: 502, message: 'Invalid story response from backend' })
  return mapStory(story)
})
