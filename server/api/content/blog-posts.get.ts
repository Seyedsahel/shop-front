export default defineEventHandler(async (event): Promise<BlogPostsResponse> => {
  const config = useRuntimeConfig()
  if (config.useMockData) return mockBlogPostsResponse
  const response = await backendFetch<unknown>('/content/blog-posts')
  if (!response || typeof response !== 'object' || !Array.isArray((response as Record<string, unknown>).items)) {
    throw createError({ statusCode: 502, message: 'Invalid blog posts response from backend' })
  }
  return response as BlogPostsResponse
})
