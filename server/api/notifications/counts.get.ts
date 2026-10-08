export default defineEventHandler(async (event): Promise<NotificationCounts> => {
  requireNotificationUser(event)
  return backendFetch<NotificationCounts>('/notifications/counts', { authorization: 'user' }, event)
})
