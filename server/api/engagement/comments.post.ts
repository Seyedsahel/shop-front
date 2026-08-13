export default defineEventHandler(async (event) => {
  const body = await readBody<SubmitCommentPayload>(event)
  const config = useRuntimeConfig()

  if (config.useMockData) return { success: true }

  return await backendFetch('/engagement/comments', { method: 'POST', body })
})