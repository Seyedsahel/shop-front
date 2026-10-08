export default defineEventHandler(async event => {
  requireNotificationUser(event)
  const id = getRouterParam(event, 'id')
  if (!id || !id.trim()) throw createError({ statusCode: 400, message: 'شناسه اعلان معتبر نیست.' })
  await backendFetch(`/notifications/${encodeURIComponent(id)}/read`, { method: 'POST', authorization: 'user' }, event)
  return sendNoContent(event, 204)
})
