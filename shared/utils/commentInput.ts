export function parseCommentInput(value: unknown): SubmitCommentPayload | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const body = value as Record<string, unknown>
  if ((body.targetType !== 'product' && body.targetType !== 'post')
    || typeof body.targetId !== 'string' || !body.targetId.trim()
    || typeof body.content !== 'string' || !body.content.trim()
    || (body.parentId !== undefined && (typeof body.parentId !== 'string' || !body.parentId.trim()))) return null
  return {
    targetType: body.targetType,
    targetId: body.targetId.trim(),
    content: body.content.trim(),
    ...(typeof body.parentId === 'string' ? { parentId: body.parentId.trim() } : {}),
  }
}
