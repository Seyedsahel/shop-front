export default defineEventHandler(async (event): Promise<CreatedCommentResponse> => {
  const body = await readBody<SubmitCommentPayload>(event)

  if ((body.targetType !== 'product' && body.targetType !== 'blog') || !body.targetId || !body.content?.trim()) {
    throw createError({ statusCode: 400, message: 'Invalid comment' })
  }

  return await backendFetch<CreatedCommentResponse>('/api/comments', {
    method: 'POST',
    authorization: 'user',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
      body: body.content.trim(),
      comment_type: body.targetType,
      reference_id: body.targetId,
      ...(body.parentId ? { parent_id: body.parentId } : {}),
    }),
  }, event)
})
