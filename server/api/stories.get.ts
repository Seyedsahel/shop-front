export default defineEventHandler(async (event): Promise<StoriesResponse> => {
  const stories = await backendFetch<unknown>('/stories', { authorization: 'none' }, event)
  if (!Array.isArray(stories)) throw createError({ statusCode: 502, message: 'Invalid stories response from backend' })
  return { items: stories.map(mapStory) }
})
