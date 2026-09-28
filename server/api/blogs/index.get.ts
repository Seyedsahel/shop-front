export default defineEventHandler(async (event): Promise<BlogPostsResponse> => {
  const response = await backendFetch<unknown>('/blogs', { authorization: 'none' }, event)
  if (!response || typeof response !== 'object' || !Array.isArray((response as Record<string, unknown>).items)) {
    throw createError({ statusCode: 502, message: 'Invalid blogs response from backend' })
  }

  const payload = response as Record<string, unknown>
  const rawItems = payload.items as unknown[]
  const items = rawItems.flatMap((post) => {
    const mapped = mapBlogPost(post)
    return mapped ? [mapped] : []
  })

  return {
    items,
    total: typeof payload.total === 'number' ? payload.total : items.length,
    page: typeof payload.page === 'number' ? payload.page : 1,
    limit: typeof payload.limit === 'number' ? payload.limit : items.length,
  }
})
