export default defineEventHandler(async (event): Promise<CreatedCommentResponse> => {
  const body = parseCommentInput(await readBody<unknown>(event))

  if (!body) {
    const message = 'اطلاعات نظر معتبر نیست؛ متن و شناسه هدف را بررسی کنید.'
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message, data: { validationMessage: message } })
  }

  return await backendFetch<CreatedCommentResponse>('/comments', {
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
