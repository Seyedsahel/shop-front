export default defineEventHandler(async (event): Promise<BlogPostsResponse> => {
  const config = useRuntimeConfig()
  return config.useMockData ? mockBlogPostsResponse : await backendFetch<BlogPostsResponse>('/content/blog-posts')
})