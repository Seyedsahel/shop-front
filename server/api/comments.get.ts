interface BackendComment {
  id: string
  user_id: string
  user_name?: string | null
  author_name?: string | null
  body: string
  parent_id: string | null
  created_at: number
}

function mapComment(comment: BackendComment): AppComment {
  return {
    id: comment.id,
    authorName: comment.author_name || comment.user_name || 'کاربر',
    content: comment.body,
    createdAt: new Date(comment.created_at * 1000).toLocaleString('fa-IR'),
    parentId: comment.parent_id,
  }
}

export default defineEventHandler(async (event): Promise<CommentsResponse> => {
  const { targetType, targetId } = getQuery(event)
  if ((targetType !== 'product' && targetType !== 'blog') || typeof targetId !== 'string' || !targetId) {
    throw createError({ statusCode: 400, message: 'Invalid comment target' })
  }

  const comments = await backendFetch<unknown>('/comments', {
    query: { comment_type: targetType, reference_id: targetId },
    authorization: 'none',
  }, event)
  if (!Array.isArray(comments)) throw createError({ statusCode: 502, message: 'Invalid comments response from backend' })
  return { items: comments.map(mapComment) }
})
