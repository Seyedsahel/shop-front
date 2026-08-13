export default defineEventHandler(async (event): Promise<CommentsResponse> => {
  const config = useRuntimeConfig()
  const { targetType, targetId } = getQuery(event) as { targetType: string; targetId: string }

  if (config.useMockData) {
    return { items: getMockComments(targetType, targetId) }
  }
  return await backendFetch<CommentsResponse>(`/engagement/comments?targetType=${targetType}&targetId=${targetId}`)
})