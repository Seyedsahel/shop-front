export default defineEventHandler(async (event): Promise<BlogPostDetail> => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Blog slug is required' })

  const response = await backendFetch<unknown>(`/blogs/${encodeURIComponent(slug)}`, { authorization: 'none' }, event)
  const post = mapBlogPostDetail(response)
  if (!post) throw createError({ statusCode: 502, message: 'Invalid blog response from backend' })
  return post
})
