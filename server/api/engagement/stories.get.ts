// server/api/engagement/stories.get.ts
export default defineEventHandler(async (event): Promise<StoriesResponse> => {
  const config = useRuntimeConfig()

  if (config.useMockData) {
    return mockStoriesResponse
  }

  return await backendFetch<StoriesResponse>('/engagement/stories')
})