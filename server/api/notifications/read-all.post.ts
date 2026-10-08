export default defineEventHandler(async event => {
  requireNotificationUser(event)
  await backendFetch('/notifications/read-all', { method: 'POST', authorization: 'user' }, event)
  return sendNoContent(event, 204)
})
